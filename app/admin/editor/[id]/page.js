"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import useAdmin from "@/components/useAdmin";

const uid = () => Math.random().toString(36).slice(2, 10);

function slugify(text) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "post"
  );
}

const LABELS = { heading: "Título de seção", text: "Texto", image: "Imagem" };

function Editor() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";

  const [loaded, setLoaded] = useState(isNew);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState(null);
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState([{ id: uid(), type: "text", text: "" }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (isNew) return;
    supabase.from("posts").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setPublished(data.published);
        setBlocks(data.blocks || []);
      }
      setLoaded(true);
    });
  }, [id, isNew]);

  const update = (bid, patch) => setBlocks((bs) => bs.map((b) => (b.id === bid ? { ...b, ...patch } : b)));
  const add = (type) => setBlocks((bs) => [...bs, { id: uid(), type, text: "", url: "", caption: "" }]);
  const remove = (bid) => setBlocks((bs) => bs.filter((b) => b.id !== bid));
  const move = (i, dir) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function upload(bid, file) {
    if (!file) return;
    setMsg("Enviando imagem…");
    const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${Date.now()}-${uid()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) return setMsg("Erro no upload: " + error.message);
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    update(bid, { url: data.publicUrl });
    setMsg("");
  }

  async function save(nextPublished = published) {
    if (!title.trim()) return setMsg("Dê um título à postagem.");
    setSaving(true);
    setMsg("");
    const row = { title: title.trim(), blocks, published: nextPublished, updated_at: new Date().toISOString() };
    let error;
    if (isNew) {
      ({ error } = await supabase.from("posts").insert({ ...row, slug: `${slugify(title)}-${uid().slice(0, 4)}` }));
      if (!error) return router.push("/admin");
    } else {
      ({ error } = await supabase.from("posts").update(row).eq("id", id));
    }
    setSaving(false);
    if (error) return setMsg("Erro ao salvar: " + error.message);
    setPublished(nextPublished);
    setMsg("Salvo ✔");
  }

  if (!loaded) return <p className="muted">Carregando…</p>;

  return (
    <>
      <div className="row" style={{ marginTop: 24 }}>
        <Link href="/admin" className="muted small">← Painel</Link>
        <span className={`badge ${published ? "live" : ""}`}>{published ? "Publicado" : "Rascunho"}</span>
      </div>

      <input
        type="text"
        className="title-input"
        style={{ marginTop: 16 }}
        placeholder="Título da postagem"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {blocks.map((b, i) => (
        <div key={b.id} className="block">
          <div className="tools">
            <span className="tag">{LABELS[b.type]}</span>
            <button className="btn sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn sm" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}>↓</button>
            <button className="btn sm danger" onClick={() => remove(b.id)}>Remover</button>
          </div>

          {b.type === "heading" && (
            <input type="text" placeholder="Título da seção" value={b.text} onChange={(e) => update(b.id, { text: e.target.value })} />
          )}
          {b.type === "text" && (
            <textarea placeholder="Escreva seu texto…" value={b.text} onChange={(e) => update(b.id, { text: e.target.value })} />
          )}
          {b.type === "image" && (
            <div className="stack">
              {b.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.url} alt="" />
              )}
              <input type="file" accept="image/*" onChange={(e) => upload(b.id, e.target.files[0])} />
              <input type="text" placeholder="Legenda (opcional)" value={b.caption || ""} onChange={(e) => update(b.id, { caption: e.target.value })} />
            </div>
          )}
        </div>
      ))}

      <div className="addbar">
        <button className="btn" onClick={() => add("heading")}>+ Título de seção</button>
        <button className="btn" onClick={() => add("text")}>+ Texto</button>
        <button className="btn" onClick={() => add("image")}>+ Imagem</button>
      </div>

      <div className="row" style={{ justifyContent: "flex-start", marginBottom: 60 }}>
        <button className="btn" onClick={() => save(false)} disabled={saving}>Salvar rascunho</button>
        <button className="btn primary" onClick={() => save(true)} disabled={saving}>
          {published ? "Salvar e manter publicado" : "Publicar"}
        </button>
        {msg && <span className={msg.startsWith("Erro") ? "err small" : "muted small"}>{msg}</span>}
      </div>
    </>
  );
}

export default function EditorPage() {
  const { loading, isAdmin } = useAdmin();
  if (loading) return <p className="muted">Carregando…</p>;
  if (!isAdmin)
    return (
      <p>
        Acesso restrito. <Link href="/admin">Entrar como administrador</Link>
      </p>
    );
  return <Editor />;
}
