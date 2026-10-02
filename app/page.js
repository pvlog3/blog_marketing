import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { coverOf, excerptOf, formatDate } from "@/lib/posts";
import Hero from "@/components/Hero";

export const revalidate = 0; // sempre busca postagens atualizadas

function Thumb({ post, className = "" }) {
  const img = coverOf(post);
  return (
    <div className={`thumb ${className}`}>
      {img ? <img src={img} alt="" /> : <span>{post.title[0]}</span>}
    </div>
  );
}

export default async function Home({ searchParams }) {
  const { q = "" } = await searchParams;
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, created_at, blocks")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const all = data || [];
  const term = q.trim().toLowerCase();
  const posts = term
    ? all.filter((p) =>
        (p.title + " " + p.blocks.map((b) => b.text || "").join(" ")).toLowerCase().includes(term)
      )
    : all;
  const rows = posts.slice(0, 2);
  const cards = posts.slice(2);

  return (
    <>
      {all.length > 0 && <Hero posts={all.slice(0, 4)} />}

      <div className="wide layout">
        <section id="postagens">
          <h2 className="section-title">{term ? `Resultados para “${q}”` : "Postagens"}</h2>
          {error && <p className="err">Erro ao carregar: {error.message}</p>}
          {!error && posts.length === 0 && (
            <p className="muted">{term ? "Nada encontrado." : "Nenhuma postagem ainda."}</p>
          )}

          {rows.map((p, i) => (
            <article key={p.slug} className={`feature ${i % 2 ? "flip" : ""}`}>
              <Link href={`/posts/${p.slug}`}><Thumb post={p} /></Link>
              <div>
                <h3><Link href={`/posts/${p.slug}`}>{p.title}</Link></h3>
                <p className="excerpt">{excerptOf(p)}</p>
                <div className="meta">
                  <Link href={`/posts/${p.slug}`} className="pill">Ler mais</Link>
                  <span className="muted small">{formatDate(p.created_at)}</span>
                </div>
              </div>
            </article>
          ))}

          {cards.length > 0 && (
            <div className="cards">
              {cards.map((p) => (
                <article key={p.slug} className="mini">
                  <Link href={`/posts/${p.slug}`}><Thumb post={p} className="short" /></Link>
                  <h4><Link href={`/posts/${p.slug}`}>{p.title}</Link></h4>
                  <p className="excerpt small">{excerptOf(p, 90)}</p>
                  <div className="meta">
                    <Link href={`/posts/${p.slug}`} className="pill sm">Ler mais</Link>
                    <span className="muted small">{formatDate(p.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="side-pink">
            <h3 className="side-title">Sobre o blog</h3>
            <p className="muted small">Blog criado como trabalho da faculdade. Aqui ficam as postagens do curso.</p>

            {all.length > 0 && (
              <>
                <h3 className="side-title" style={{ marginTop: 28 }}>Recentes</h3>
                <div className="recent">
                  {all.slice(0, 6).map((p) => (
                    <Link key={p.slug} href={`/posts/${p.slug}`} className="recent-item">
                      <span className="circle">
                        {coverOf(p) ? <img src={coverOf(p)} alt="" /> : <b>{p.title[0]}</b>}
                      </span>
                      <span className="small">{p.title}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="side-green">
            <h3>Trabalho de faculdade</h3>
            <p className="small">Obrigado pela visita!</p>
          </div>
        </aside>
      </div>
    </>
  );
}
