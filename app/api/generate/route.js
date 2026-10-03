import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60; // segundos (reintentos pueden tardar)

const SYSTEM =
  "Eres un redactor de un blog universitario sobre marketing. Escribe siempre en español, " +
  "con un tono claro y académico pero cercano. No uses Markdown (nada de #, ** ni listas con guiones); " +
  "separa los párrafos con una línea en blanco.";

const json = (body, status = 200) => Response.json(body, { status });

// Só deixa passar quem está logado e consta na tabela "admins"
async function isAdmin(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData?.user) return false;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", userData.user.id).maybeSingle();
  return !!data;
}

// Modelos gratuitos, em ordem de preferência; se um estiver ocupado/indisponível, tenta o próximo
const MODELS = [process.env.GEMINI_MODEL, "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"]
  .filter(Boolean)
  .filter((m, i, a) => a.indexOf(m) === i);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function callModel(model, prompt, generationConfig) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
}

async function gemini(prompt, generationConfig = {}) {
  let last = 0;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await callModel(model, prompt, generationConfig);
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
        if (text.trim()) return text.trim();
        last = 0;
        break; // resposta vazia: tenta outro modelo
      }
      last = res.status;
      if (res.status === 503 || res.status === 500) await wait(1200); // sobrecarga: tenta de novo
      else break; // 404/429/outros: passa para o próximo modelo
    }
  }
  const msg =
    last === 429 ? "Límite de uso de Gemini alcanzado. Espera un momento e inténtalo de nuevo."
    : last === 503 ? "Gemini está saturado en este momento. Inténtalo de nuevo en unos segundos."
    : last === 404 ? "Ningún modelo de Gemini está disponible. Define GEMINI_MODEL con un modelo vigente."
    : last ? `Error de Gemini (${last}).`
    : "La IA no devolvió texto. Prueba con otra instrucción.";
  throw Object.assign(new Error(msg), { status: last === 429 ? 429 : 502 });
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) return json({ error: "Falta configurar GEMINI_API_KEY en el servidor." }, 500);
  if (!(await isAdmin(request))) return json({ error: "No autorizado." }, 401);

  const { mode, prompt, title } = await request.json().catch(() => ({}));
  if (!prompt?.trim() || prompt.length > 1000) return json({ error: "Escribe una instrucción (máx. 1000 caracteres)." }, 400);

  try {
    if (mode === "draft") {
      const out = await gemini(
        `Crea una publicación completa de blog sobre: ${prompt}\n` +
          "Devuelve un título atractivo y entre 4 y 6 secciones. Cada sección tiene un subtítulo corto y 1 o 2 párrafos.",
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              sections: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: { heading: { type: "STRING" }, text: { type: "STRING" } },
                  required: ["heading", "text"],
                },
              },
            },
            required: ["title", "sections"],
          },
        }
      );
      return json(JSON.parse(out));
    }
    const context = title?.trim() ? `Título de la publicación: ${title}\n` : "";
    const text = await gemini(`${context}Escribe el siguiente texto para la publicación: ${prompt}`);
    return json({ text });
  } catch (e) {
    return json({ error: e.message }, e.status || 500);
  }
}
