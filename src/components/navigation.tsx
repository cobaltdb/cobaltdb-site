"use client";
import { Github } from "@/components/github-icon";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Command, Menu, Search, X } from "lucide-react";
import { Logo } from "./logo";
import { REPO, searchItems } from "@/lib/site";

export function Navigation() {
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const openSearch = useCallback(() => {
    setQuery("");
    setMenu(false);
    dialog.current?.showModal();
    search.current?.focus();
  }, []);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape") {
        if (menuButton.current?.getAttribute("aria-expanded") === "true")
          menuButton.current.focus();
        setMenu(false);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [openSearch]);
  const items = searchItems.filter((item) =>
    `${item.title} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="CobaltDB home">
            <Logo />
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            <Link href="/#features">Why CobaltDB</Link>
            <Link
              href="/docs/getting-started/"
              aria-current={path.startsWith("/docs") ? "page" : undefined}
            >
              Documentation
            </Link>
            <Link href="/#benchmarks">Benchmarks</Link>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="search-trigger"
              onClick={openSearch}
              aria-label="Search documentation"
            >
              <Search size={16} />
              <kbd>⌘ K</kbd>
            </button>
            <a
              href={REPO}
              className="github-link"
              aria-label="CobaltDB on GitHub"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
              <span>GitHub</span>
              <ArrowUpRight size={13} />
            </a>
            <button
              type="button"
              className="menu-trigger"
              ref={menuButton}
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-menu"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {[
              ["Why CobaltDB", "/#features"],
              ["Documentation", "/docs/getting-started/"],
              ["Benchmarks", "/#benchmarks"],
              ["Brand assets", "/brand/"],
            ].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={16} />
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                openSearch();
              }}
            >
              Search documentation
              <Search size={16} />
            </button>
          </nav>
        )}
      </header>
      <dialog
        className="search-dialog"
        ref={dialog}
        onKeyDown={(e) => {
          if (e.key === "Escape") dialog.current?.close();
        }}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        aria-labelledby="search-title"
      >
        <div className="search-top">
          <Search size={20} />
          <label className="sr-only" htmlFor="doc-search" id="search-title">
            Search documentation
          </label>
          <input
            ref={search}
            id="doc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation…"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>
        <div className="search-results" aria-live="polite">
          {items.length ? (
            items.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => dialog.current?.close()}
              >
                <BookOpen size={18} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))
          ) : (
            <p className="empty-search">
              No results for “{query}”. Try SQL, server or security.
            </p>
          )}
        </div>
        <div className="search-bottom">
          <Command size={13} /> K to open <span>ESC to close</span>
        </div>
      </dialog>
    </>
  );
}
