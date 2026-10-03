import { createClient } from "@supabase/supabase-js";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

async function gemini(prompt, generationConfig = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
  if (!res.ok) {
    const err = new Error(res.status === 429 ? "Límite de uso de Gemini alcanzado. Espera un momento e inténtalo de nuevo." : `Error de Gemini (${res.status}).`);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text.trim()) throw Object.assign(new Error("La IA no devolvió texto. Prueba con otra instrucción."), { status: 502 });
  return text.trim();
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
