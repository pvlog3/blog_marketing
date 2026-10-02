import "./globals.css";
import Link from "next/link";
import { Montserrat, Great_Vibes } from "next/font/google";

const sans = Montserrat({ subsets: ["latin"], variable: "--font-sans" });
const script = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-script" });

export const metadata = {
  title: "Blog Marketing",
  description: "Blog da faculdade",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${script.variable}`}>
      <body>
        <header className="topbar">
          <div className="wide">
            <Link href="/" className="brand">
              BLOG <span>Marketing</span>
            </Link>
            <nav className="nav">
              <Link href="/">Home</Link>
              <Link href="/#postagens">Postagens</Link>
              <form action="/" className="search">
                <input type="search" name="q" placeholder="Buscar" aria-label="Buscar" />
              </form>
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          Trabalho de faculdade · <Link href="/admin">Admin</Link>
        </footer>
      </body>
    </html>
  );
}
