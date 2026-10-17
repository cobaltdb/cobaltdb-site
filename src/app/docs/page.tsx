import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
      <nav className="resource-grid" aria-label="Documentation guides">
        {docPages.map((p) => (
          <Link
            className="resource-card"
            href={`/docs/${p.slug}/`}
            key={p.slug}
          >
            <span className="eyebrow">{p.group}</span>
            <h2>{p.title}</h2>
            <p>{p.description}</p>
            <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        ))}
      </nav>
    </main>
  );
}
