// Ajudantes para montar os cartões a partir dos blocos de uma postagem
export const coverOf = (post) => post.blocks?.find((b) => b.type === "image" && b.url)?.url || null;

export function excerptOf(post, max = 200) {
  const text = post.blocks?.find((b) => b.type === "text" && b.text?.trim())?.text.trim() || "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export const formatDate = (d) => new Date(d).toLocaleDateString("pt-BR");
