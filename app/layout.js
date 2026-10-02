import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Meu Blog",
  description: "Blog da faculdade",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="wrap row">
            <Link href="/" className="brand">Meu Blog</Link>
            <Link href="/admin" className="muted small">Admin</Link>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap muted small foot">Trabalho de faculdade</footer>
      </body>
    </html>
  );
}
