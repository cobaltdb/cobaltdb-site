import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUpRight, ChevronRight } from "lucide-react";
import { docPages, REPO, VERSION } from "@/lib/site";
import { docContent } from "@/lib/docs";

export function generateStaticParams() {
  return docPages.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = docPages.find((p) => p.slug === slug);
  return {
    title: page?.title,
    description: page?.description,
    alternates: { canonical: `/docs/${slug}/` },
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = docPages.find((p) => p.slug === slug);
  if (!page || !docContent[slug]) notFound();
  const sections = docContent[slug];
  const index = docPages.findIndex((p) => p.slug === slug);
  const prev = docPages[index - 1],
    next = docPages[index + 1];
  const nav = (
    <>
      {["Start here", "Build", "Deploy"].map((group) => (
        <div className="docs-nav-group" key={group}>
          <h2>{group}</h2>
          {docPages
            .filter((p) => p.group === group)
            .map((p) => (
              <Link
                aria-current={slug === p.slug ? "page" : undefined}
                href={`/docs/${p.slug}/`}
                key={p.slug}
              >
                {p.title}
              </Link>
            ))}
        </div>
      ))}
    </>
  );
  return (
    <main id="main" className="container docs-layout">
      <aside className="docs-sidebar">
        <span>DOCUMENTATION · v{VERSION}</span>
        <nav aria-label="Documentation">{nav}</nav>
        <a className="docs-source" href={REPO}>
          View on GitHub
          <ArrowUpRight size={13} />
        </a>
      </aside>
      <div className="docs-mobile-nav">
        <details>
          <summary>
            Documentation
            <ArrowDown size={14} />
          </summary>
          <nav aria-label="Documentation">
            {docPages.map((p) => (
              <Link
                key={p.slug}
                href={`/docs/${p.slug}/`}
                aria-current={slug === p.slug ? "page" : undefined}
              >
                {p.title}
              </Link>
            ))}
          </nav>
        </details>
      </div>
      <article className="docs-article">
        <div className="breadcrumb">
          <Link href="/">CobaltDB</Link>
          <ChevronRight size={11} />
          <span>Documentation</span>
          <ChevronRight size={11} />
          <span>{page.title}</span>
        </div>
        <h1>{page.title}</h1>
        <p className="docs-lead">{page.description}</p>
        <nav className="docs-toc" aria-label="On this page">
          <span>ON THIS PAGE</span>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title.replace(/^\d+\. /, "")}
            </a>
          ))}
        </nav>
        {sections.map((section) => (
          <section id={section.id} className="docs-section" key={section.id}>
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}
        <div className="docs-updated">
          <span>Source-aligned guide · CobaltDB v{VERSION}</span>
          <a href={`${REPO}/issues/new`}>
            Suggest an improvement
            <ArrowUpRight size={11} />
          </a>
        </div>
        <nav className="docs-next" aria-label="Previous and next guide">
          {prev && (
            <Link href={`/docs/${prev.slug}/`}>
              <small>← PREVIOUS</small>
              {prev.title}
            </Link>
          )}
          {next && (
            <Link href={`/docs/${next.slug}/`}>
              <small>NEXT →</small>
              {next.title}
            </Link>
          )}
        </nav>
      </article>
    </main>
  );
}
