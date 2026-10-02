"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import useAdmin from "@/components/useAdmin";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("E-mail ou senha incorretos.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="stack" style={{ maxWidth: 360 }}>
      <h1>Entrar</h1>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <div className="err small">{error}</div>}
      <button className="btn primary" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}

function Dashboard() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, published, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setPosts(data);
  }
  useEffect(() => { load(); }, []);

  async function remove(p) {
    if (!confirm(`Excluir "${p.title}"? Não dá para desfazer.`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) setError(error.message);
    else load();
  }

  async function togglePublish(p) {
    const { error } = await supabase.from("posts").update({ published: !p.published }).eq("id", p.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <>
      <div className="row" style={{ marginTop: 28 }}>
        <h1 style={{ margin: 0 }}>Painel</h1>
        <div className="row">
          <Link href="/admin/editor/new" className="btn primary">+ Nova postagem</Link>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>
      {error && <p className="err">{error}</p>}
      {posts === null && <p className="muted">Carregando…</p>}
      {posts?.length === 0 && <p className="muted">Nenhuma postagem. Crie a primeira!</p>}
      {posts?.map((p) => (
        <div key={p.id} className="card" style={{ cursor: "default" }}>
          <div className="row">
            <div>
              <h2>{p.title}</h2>
              <span className={`badge ${p.published ? "live" : ""}`}>{p.published ? "Publicado" : "Rascunho"}</span>
            </div>
            <div className="row">
              {p.published && <Link href={`/posts/${p.slug}`} className="btn sm">Ver</Link>}
              <Link href={`/admin/editor/${p.id}`} className="btn sm">Editar</Link>
              <button className="btn sm" onClick={() => togglePublish(p)}>{p.published ? "Despublicar" : "Publicar"}</button>
              <button className="btn sm danger" onClick={() => remove(p)}>Excluir</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminPage() {
  const { loading, session, isAdmin } = useAdmin();
  if (loading) return <p className="muted">Carregando…</p>;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="stack">
        <h1>Sem permissão</h1>
        <p className="muted">Essa conta não é administradora. Você pode apenas visualizar as postagens.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    );
  return <Dashboard />;
}
