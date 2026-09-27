import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Sliders, Activity } from "lucide-react";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "D3 MusiQ — Create Music. Your Way.",
  description: "An open, hands-on music creation workspace bridging Western modes and Carnatic raagas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${fraunces.variable} ${archivo.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-d3-ink text-d3-neutral-300 min-h-screen flex flex-col antialiased selection:bg-d3-amber selection:text-d3-ink">
        {/* Film grain texture overlay */}
        <div className="d3-grain" />

        {/* StoryLab Console Header */}
        <header className="h-12 bg-d3-neutral-900 border-b border-d3-neutral-700 px-4 flex items-center justify-between z-40 flex-shrink-0 select-none">
          {/* Left: Brand & Ecosystem identity */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-display font-semibold text-base tracking-tight text-d3-paper group-hover:text-d3-amber transition-colors">
                D3 MusiQ
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-d3-neutral-500 border-l border-d3-neutral-700 pl-4">
              <span>CANVAS_01</span>
              <span>·</span>
              <span className="text-d3-neutral-400">Raag Yaman</span>
            </div>
          </div>

          {/* Center: Primary Navigation */}
          <nav className="flex items-center gap-1 text-xs font-medium tracking-wide uppercase">
            <Link
              href="/"
              className="px-3 py-1.5 rounded text-d3-neutral-400 hover:text-d3-paper hover:bg-d3-neutral-800 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/production"
              className="px-3 py-1.5 rounded text-d3-paper bg-d3-neutral-800 border border-d3-neutral-700 font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-d3-amber" />
              <span>Production</span>
            </Link>
            <Link
              href="/breakdown"
              className="px-3 py-1.5 rounded text-d3-neutral-400 hover:text-d3-paper hover:bg-d3-neutral-800 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Breakdown</span>
            </Link>
          </nav>

          {/* Right: North star tagline */}
          <div className="hidden md:flex items-center gap-2.5 text-[11px] font-mono tracking-wider text-d3-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-d3-amber" />
            <span>CREATE MUSIC. YOUR WAY.</span>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
