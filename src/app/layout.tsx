import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SiteBackground } from "@/components/site-background";
import "./themes.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});
const spaceGrotesk = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space",
  display: "swap",
  weight: "300 700",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cobaltdb.dev"),
  title: {
    default: "CobaltDB — Small footprint. Serious database.",
    template: "%s | CobaltDB",
  },
  description:
    "A modern SQL database written in Go. Embed it in your app or run it as a server. SQL, JSON, ACID transactions and zero CGO.",
  openGraph: {
    type: "website",
    siteName: "CobaltDB",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "CobaltDB — Small footprint. Serious database.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      { url: "/og.png", alt: "CobaltDB — Small footprint. Serious database." },
    ],
  },
  icons: { icon: "/logo-mark.svg", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script>{`try{var t=localStorage.getItem('cobaltdb-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}`}</script>
        <script>{`try{var a=localStorage.getItem('cobaltdb-animations');document.documentElement.dataset.backgroundMotion=a==='on'||a==='off'?a:'system'}catch{}`}</script>
      </head>
      <body>
        <SiteBackground />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
