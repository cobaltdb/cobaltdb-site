import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Logo } from "@/components/logo";
import { REPO } from "@/lib/site";
export const metadata: Metadata = {
  title: "Brand assets",
  description:
    "Download the CobaltDB logo and database mark as clean, scalable SVG files.",
  alternates: { canonical: "/brand/" },
};
export default function Brand() {
  return (
    <main id="main">
      <section className="container brand-hero">
        <span className="eyebrow">THE COBALTDB IDENTITY</span>
        <h1>
          A small mark.
          <br />A clear identity.
        </h1>
        <p>
          Our database cylinder and gear, redrawn as a crisp vector. For your
          integration, article, presentation or next open-source contribution.
        </p>
      </section>
      <section className="container brand-grid" aria-label="Logo downloads">
        <div className="brand-card">
          <div className="brand-preview">
            <Logo />
          </div>
          <div className="brand-card-bottom">
            <div>
              <h2>The full signature</h2>
              <p>Outlined vector · Cobalt blue · SVG</p>
            </div>
            <a
              className="button secondary"
              href="/logo.svg"
              download="cobaltdb-logo.svg"
            >
              SVG
              <Download size={15} />
            </a>
          </div>
        </div>
        <div className="brand-card">
          <div className="brand-preview mark">
            <Logo markOnly />
          </div>
          <div className="brand-card-bottom">
            <div>
              <h2>The database mark</h2>
              <p>Scalable icon · SVG</p>
            </div>
            <a
              className="button secondary"
              href="/logo-mark.svg"
              download="cobaltdb-mark.svg"
            >
              SVG
              <Download size={15} />
            </a>
          </div>
        </div>
        <p className="brand-note">
          Keep the proportions intact, leave clear space around the logo, and
          choose a background with good contrast. Please avoid implying official
          endorsement. CobaltDB is an open-source project; see the{" "}
          <a href={`${REPO}/blob/main/LICENSE`}>project license</a> for its
          software terms.
        </p>
      </section>
    </main>
  );
}
