import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

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
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: { icon: "/logo-mark.svg", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
