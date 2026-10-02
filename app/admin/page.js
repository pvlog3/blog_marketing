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
    if (error) setError("Correo o contraseña incorrectos.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="stack" style={{ maxWidth: 360 }}>
      <h1>Iniciar sesión</h1>
      <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
    if (!confirm(`¿Eliminar "${p.title}"? No se puede deshacer.`)) return;
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
        <h1 style={{ margin: 0 }}>Panel</h1>
        <div className="row">
          <Link href="/admin/editor/new" className="btn primary">+ Nueva publicación</Link>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </div>
      {error && <p className="err">{error}</p>}
      {posts === null && <p className="muted">Cargando…</p>}
      {posts?.length === 0 && <p className="muted">No hay publicaciones. ¡Crea la primera!</p>}
      {posts?.map((p) => (
        <div key={p.id} className="card" style={{ cursor: "default" }}>
          <div className="row">
            <div>
              <h2>{p.title}</h2>
              <span className={`badge ${p.published ? "live" : ""}`}>{p.published ? "Publicado" : "Borrador"}</span>
            </div>
            <div className="row">
              {p.published && <Link href={`/posts/${p.slug}`} className="btn sm">Ver</Link>}
              <Link href={`/admin/editor/${p.id}`} className="btn sm">Editar</Link>
              <button className="btn sm" onClick={() => togglePublish(p)}>{p.published ? "Despublicar" : "Publicar"}</button>
              <button className="btn sm danger" onClick={() => remove(p)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminPage() {
  const { loading, session, isAdmin } = useAdmin();
  if (loading) return <p className="muted">Cargando…</p>;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="stack">
        <h1>Sin permiso</h1>
        <p className="muted">Esta cuenta no es administradora. Solo puedes ver las publicaciones.</p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Salir</button>
      </div>
    );
  return <Dashboard />;
}
