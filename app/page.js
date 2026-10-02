import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 0; // sempre busca postagens atualizadas

export default async function Home() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, slug, created_at, blocks")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Postagens</h1>
      {error && <p className="err">Erro ao carregar: {error.message}</p>}
      {!error && posts?.length === 0 && <p className="muted">Nenhuma postagem ainda.</p>}
      {posts?.map((p) => {
        const intro = p.blocks?.find((b) => b.type === "text")?.text || "";
        return (
          <Link key={p.slug} href={`/posts/${p.slug}`} className="card">
            <h2>{p.title}</h2>
            <div className="muted small">
              {new Date(p.created_at).toLocaleDateString("pt-BR")}
            </div>
            {intro && <p className="muted">{intro.slice(0, 160)}{intro.length > 160 ? "…" : ""}</p>}
          </Link>
        );
      })}
    </>
  );
}
