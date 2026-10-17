import Link from "next/link";
import { docPages } from "@/lib/site";
export const metadata = {
  title: "Documentation",
  alternates: { canonical: "/docs/" },
};
export default function DocsIndex() {
  return (
    <main id="main" className="container brand-hero">
      <span className="eyebrow">COBALTDB DOCUMENTATION</span>
      <h1>
        From idea
        <br />
        to first query.
      </h1>
      <p>
        Start with the embedded engine, explore SQL, and learn how to deploy.
      </p>
      <div className="docs-toc" style={{ marginTop: 35 }}>
        {docPages.map((p) => (
          <Link href={`/docs/${p.slug}/`} key={p.slug}>
            {p.title} →
          </Link>
        ))}
      </div>
    </main>
  );
}
