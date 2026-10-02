// Mostra os blocos de uma postagem (usado na página pública)
export default function BlockRenderer({ blocks }) {
  return (
    <>
      {(blocks || []).map((b) => {
        if (b.type === "heading") return <h2 key={b.id}>{b.text}</h2>;
        if (b.type === "text") return <p key={b.id}>{b.text}</p>;
        if (b.type === "image" && b.url)
          return (
            <figure key={b.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.url} alt={b.caption || ""} />
              {b.caption && <figcaption>{b.caption}</figcaption>}
            </figure>
          );
        return null;
      })}
    </>
  );
}
