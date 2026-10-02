"use client";
import { useRef } from "react";
import Link from "next/link";
import { coverOf } from "@/lib/posts";

// Faixa verde com os destaques em círculos e setas para rolar
export default function Hero({ posts }) {
  const track = useRef(null);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  const bg = posts.map(coverOf).find(Boolean);

  return (
    <section className="hero">
      {bg && <div className="hero-bg" style={{ backgroundImage: `url(${bg})` }} />}
      <div className="hero-inner">
        <button className="arrow" onClick={() => scroll(-1)} aria-label="Anterior">‹</button>
        <div className="hero-track" ref={track}>
          {posts.map((p) => {
            const img = coverOf(p);
            return (
              <Link key={p.slug} href={`/posts/${p.slug}`} className="hero-item">
                <span className="circle big">
                  {img ? <img src={img} alt="" /> : <b>{p.title[0]}</b>}
                </span>
                <span className="hero-title">{p.title}</span>
              </Link>
            );
          })}
        </div>
        <button className="arrow" onClick={() => scroll(1)} aria-label="Próximo">›</button>
      </div>
    </section>
  );
}
