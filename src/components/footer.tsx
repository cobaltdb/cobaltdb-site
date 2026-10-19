import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
import { REPO, VERSION } from "@/lib/site";
import { Studio } from "./studio";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link href="/" aria-label="CobaltDB home">
            <Logo />
          </Link>
          <p>
            A serious database.
            <br />A simpler way to build.
          </p>
          <span className="built-go">
            <span />
            Built in Go. Open by design.
          </span>
        </div>
        <div className="footer-column">
          <h3>Product</h3>
          <Link href="/#features">Features</Link>
          <Link href="/#benchmarks">Benchmarks</Link>
          <a href={`${REPO}/releases`}>
            Releases
            <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="footer-column">
          <h3>Developers</h3>
          <Link href="/docs/getting-started/">Quick start</Link>
          <Link href="/docs/sql/">SQL reference</Link>
          <Link href="/docs/architecture/">Architecture</Link>
          <Link href="/docs/production/">Production guide</Link>
        </div>
        <div className="footer-column">
          <h3>Open source</h3>
          <a href={REPO}>
            GitHub
            <ArrowUpRight size={12} />
          </a>
          <a href={`${REPO}/blob/main/CONTRIBUTING.md`}>Contributing</a>
          <a href={`${REPO}/issues`}>Issues & discussions</a>
          <Link href="/brand/">Brand assets</Link>
        </div>
      </div>
      <Studio />
      <div className="container footer-bottom">
        <span>© {new Date().getUTCFullYear()} CobaltDB contributors.</span>
        <span>MIT · Made to be yours.</span>
        <a href={`${REPO}/releases`}>
          v{VERSION}
          <ArrowUpRight size={12} />
        </a>
      </div>
    </footer>
  );
}
