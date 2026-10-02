import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BlockRenderer from "@/components/BlockRenderer";

export const revalidate = 0;

export default async function PostPage({ params }) {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("posts")
    .select("title, created_at, blocks")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) notFound();

  return (
    <article className="post">
      <p className="small" style={{ marginTop: 24 }}>
        <Link href="/" className="muted">← Voltar</Link>
      </p>
      <h1>{post.title}</h1>
      <div className="muted small">{new Date(post.created_at).toLocaleDateString("pt-BR")}</div>
      <BlockRenderer blocks={post.blocks} />
    </article>
  );
}
