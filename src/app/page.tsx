import { Github } from "@/components/github-icon";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Braces,
  Check,
  Code2,
  Database,
  LockKeyhole,
  Network,
  Package,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DatabaseArt } from "@/components/database-art";
import {
  InstallCommand,
  QueryExplorer,
  QuickStart,
  StorageDiagram,
} from "@/components/home-interactions";
import { Reveal } from "@/components/motion";
import { REPO, VERSION } from "@/lib/site";

export const metadata = { alternates: { canonical: "/" } };

const features = [
  {
    icon: Code2,
    title: "Go all the way.",
    text: "A pure Go runtime. No CGO toolchain, no C bindings. Cross-compile with the tools you already use.",
    tag: "100% Go",
  },
  {
    icon: ShieldCheck,
    title: "Keep the promises.",
    text: "ACID transactions and write-ahead logging give your application a foundation for consistent, durable data.",
    tag: "ACID + WAL",
  },
  {
    icon: LockKeyhole,
    title: "Make privacy a primitive.",
    text: "Built-in AES-256-GCM encryption, row-level security policies and audit logging for sensitive workflows.",
    tag: "Security built in",
  },
];
const faqs = [
  [
    "What is CobaltDB?",
    "CobaltDB is an open-source SQL database written in Go. You can embed the engine directly in a Go application or run a standalone server with a MySQL-compatible protocol surface.",
  ],
  [
    "Do I need a C compiler?",
    "No. The database runtime does not require CGO or a C compiler. You can build and cross-compile with the Go toolchain. The Go race detector is a separate development check and may require a CGO toolchain.",
  ],
  [
    "Is it a drop-in replacement for MySQL?",
    "CobaltDB implements a tested subset of the MySQL wire protocol. Handshakes, queries and parameterized prepared statements are covered. Validate your specific driver and ORM against the compatibility matrix before deployment.",
  ],
  [
    "Is CobaltDB ready for my production workload?",
    "The project describes CobaltDB as a production-oriented, single-node database candidate. Test your workload, recovery process and client compatibility. Replication is not automatic high availability or failover. The production guide explains the operational boundaries.",
  ],
  [
    "Can I use it commercially?",
    "Yes. CobaltDB is available under the MIT license. You can use, modify and distribute it, including in commercial projects, under the terms of that license.",
  ],
];

export default function Home() {
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <a className="release-badge" href={`${REPO}/blob/main/CHANGELOG.md`}>
            <span className="badge-dot" />
            <strong>v{VERSION}</strong>
            <span>Small engine. New possibilities.</span>
            <ArrowRight size={13} />
          </a>
          <h1>
            Small footprint.
            <br />
            <span>Serious database.</span>
          </h1>
          <p className="hero-description">
            All the database you need.
            <br />
            Right where your application lives.
          </p>
          <p className="hero-detail">
            A modern SQL database written in Go. Embed it in your app or run it
            as a server. Your data, your architecture.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/docs/getting-started/">
              Start building
              <ArrowRight size={17} />
            </Link>
            <a
              className="button secondary"
              href={REPO}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
              Explore the source
              <ArrowUpRight size={14} />
            </a>
          </div>
          <InstallCommand />
          <div className="hero-proof">
            <span>
              <Check size={13} />
              Open source · MIT
            </span>
            <span>
              <Check size={13} />
              Zero CGO
            </span>
            <span>
              <Check size={13} />
              Yours to build on
            </span>
          </div>
        </div>
        <DatabaseArt />
      </section>
      <div className="capability-strip">
        <div className="container">
          <span className="strip-intro">
            SMALL BY DESIGN.
            <br />
            <strong>COMPLETE BY NATURE.</strong>
          </span>
          {[
            { icon: Database, title: "SQL + JSON" },
            { icon: ShieldCheck, title: "ACID transactions" },
            { icon: Code2, title: "Pure Go" },
            { icon: LockKeyhole, title: "Built-in encryption" },
            { icon: Network, title: "MySQL protocol" },
          ].map((item) => (
            <span className="strip-item" key={item.title}>
              <item.icon size={18} />
              {item.title}
            </span>
          ))}
        </div>
      </div>
      <section className="section container" id="features">
        <Reveal>
          <div className="section-heading">
            <div>
              <span className="eyebrow">BUILT FOR THE WAY YOU BUILD</span>
              <h2>
                Less infrastructure.
                <br />
                More possibility.
              </h2>
            </div>
            <p>
              Your database should move your application forward.
              <br className="desktop-break" /> A capable engine, without the
              operational weight.
            </p>
          </div>
        </Reveal>
        <div className="feature-grid">
          <Reveal className="feature-architecture">
            <div>
              <span className="feature-number">01 / THE ENGINE</span>
              <h3>
                Powerful at the core.
                <br />
                Simple at the edges.
              </h3>
              <p>
                SQL parsing, indexed storage and durable writes.
                <br />
                One cohesive engine you can run your way.
              </p>
              <Link href="/docs/architecture/" className="text-link">
                Look under the hood
                <ArrowRight size={15} />
              </Link>
            </div>
            <StorageDiagram />
          </Reveal>
          {features.map((feature, i) => (
            <Reveal
              className="feature-card"
              key={feature.title}
              delay={i * 0.07}
            >
              <div className="feature-icon">
                <feature.icon size={22} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <span className="feature-tag">
                {feature.tag}
                <ArrowUpRight size={13} />
              </span>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section quick-section" id="quickstart">
        <div className="container">
          <Reveal>
            <QuickStart />
          </Reveal>
        </div>
      </section>
      <section className="section container">
        <Reveal>
          <QueryExplorer />
        </Reveal>
      </section>
      <section className="section performance-section" id="benchmarks">
        <div className="container">
          <Reveal>
            <div className="section-heading">
              <div>
                <span className="eyebrow">SMALL DOESN’T MEAN SLOW</span>
                <h2>
                  Built close to the metal.
                  <br />
                  And closer to your app.
                </h2>
              </div>
              <p>
                No network hop in embedded mode.
                <br />A purpose-built storage engine underneath.
              </p>
            </div>
            <div className="benchmark-grid">
              <div className="benchmark-card">
                <span className="benchmark-label">
                  <Zap size={17} />
                  B+ TREE · POINT LOOKUP
                </span>
                <div className="benchmark-number">
                  64<span>ns</span>
                </div>
                <p>Core storage GET latency</p>
                <div className="benchmark-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="benchmark-card">
                <span className="benchmark-label">
                  <Braces size={17} />
                  SQL ENGINE · INSERT
                </span>
                <div className="benchmark-number">
                  2.0<span>µs</span>
                </div>
                <p>Single row, including SQL parsing</p>
                <div className="benchmark-spark">
                  <svg viewBox="0 0 300 36" fill="none" aria-hidden="true">
                    <path
                      d="M0 28h22l10-8 15 4 15-12 17 7 17-9 18 8 17-7 19 4 20-9 17 7 20-6 17 5 18-8 17 4 22-7 19 6"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M0 35h300"
                      stroke="currentColor"
                      strokeOpacity=".2"
                    />
                  </svg>
                </div>
              </div>
              <div className="benchmark-card">
                <span className="benchmark-label">
                  <Blocks size={17} />
                  INDEXED SQL · LOOKUP
                </span>
                <div className="benchmark-number">
                  2.1<span>µs</span>
                </div>
                <p>Point lookup over a 10K-row dataset</p>
                <div className="benchmark-foot">
                  <span className="status-dot" />
                  Made for the hot path.
                </div>
              </div>
            </div>
            <div className="benchmark-method">
              <div>
                <strong>Context matters. Here’s ours.</strong>
                <p>
                  Repository-reported in-memory benchmarks · AMD Ryzen 9 9950X3D
                  · Go 1.26 · Windows 11. Storage-level and SQL-level results
                  measure different operations. Results vary by workload and
                  hardware; disk persistence adds overhead.
                </p>
              </div>
              <a className="text-link" href={`${REPO}#-performance-benchmarks`}>
                Read the methodology
                <ArrowUpRight size={15} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section container deployment-section">
        <Reveal>
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR APP. YOUR ARCHITECTURE.</span>
              <h2>
                One engine.
                <br />
                Two ways to make it yours.
              </h2>
            </div>
            <p>
              Start with the deployment that fits.
              <br />
              Keep the same SQL foundation.
            </p>
          </div>
          <div className="deployment-grid">
            <div className="deployment-card">
              <span className="deployment-label">
                <Code2 size={18} />
                EMBEDDED
              </span>
              <h3>
                Inside your process.
                <br />
                Out of your way.
              </h3>
              <p>
                Import the Go engine and open a database. An ideal starting
                point for local tools, desktop apps, edge services and
                self-contained applications.
              </p>
              <div className="deployment-visual">
                <span>Your Go application</span>
                <div>
                  <Package size={20} />
                  <strong>CobaltDB</strong>
                  <span>app.db</span>
                </div>
              </div>
              <Link href="/docs/getting-started/" className="text-link">
                Build with embedded
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="deployment-card">
              <span className="deployment-label">
                <Network size={18} />
                STANDALONE
              </span>
              <h3>
                A familiar connection.
                <br />A fresh foundation.
              </h3>
              <p>
                Run CobaltDB as a service and connect over its MySQL protocol.
                Start with the tested Go driver, then validate the clients your
                application needs.
              </p>
              <div className="deployment-visual server-visual">
                <div className="client-tags">
                  <span>Go</span>
                  <span>Python</span>
                  <span>Node.js</span>
                  <span>Java</span>
                </div>
                <ArrowDown size={22} />
                <div>
                  <Database size={20} />
                  <strong>CobaltDB server</strong>
                  <span>:3307</span>
                </div>
              </div>
              <Link href="/docs/server/" className="text-link">
                Connect to the server
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="compatibility-note">
            <ShieldCheck size={17} />
            <span>
              MySQL protocol compatibility is explicit. Check the{" "}
              <a href={`${REPO}/blob/main/docs/MYSQL_COMPATIBILITY.md`}>
                tested client matrix
                <ArrowUpRight size={12} />
              </a>{" "}
              for your workflow.
            </span>
          </div>
        </Reveal>
      </section>
      <section className="section container faq-section">
        <div>
          <span className="eyebrow">A FEW GOOD QUESTIONS</span>
          <h2>
            Before you
            <br />
            dive in.
          </h2>
          <p>Still curious? The source is open.</p>
          <a href={`${REPO}/issues`} className="text-link">
            Start a conversation
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <details key={q}>
              <summary>
                <span className="faq-number">0{i + 1}</span>
                {q}
                <span className="faq-plus">+</span>
              </summary>
              <p>
                {a}
                {i === 3 && (
                  <>
                    {" "}
                    <Link href="/docs/production/">
                      Read the production guide →
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="cta-section">
        <div className="container">
          <div className="cta-mark" aria-hidden="true">{`{ }`}</div>
          <Reveal>
            <span className="eyebrow">OPEN SOURCE. OPEN POSSIBILITIES.</span>
            <h2>
              Your next great thing
              <br />
              starts with a simple import.
            </h2>
            <div className="cta-buttons">
              <Link href="/docs/getting-started/" className="button white">
                Let’s build something
                <ArrowRight size={17} />
              </Link>
              <a href={REPO} className="button ghost">
                <Github size={18} />
                Star on GitHub
                <ArrowUpRight size={15} />
              </a>
            </div>
            <p>Pure Go. MIT licensed. Built for your ideas.</p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
