import type { Metadata, Viewport } from "next";
import { IconSprite } from "@/components/Icons";
// Self-hosted fonts (bundled from npm, no external font requests).
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keapr Training",
  description: "Internal training for Keapr staff.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies the saved light/dark choice before first paint so the page
// doesn't flash light when someone has picked dark.
const modeScript = `try{if(localStorage.getItem('keapr-mode')==='dark'){document.documentElement.setAttribute('data-mode','dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
