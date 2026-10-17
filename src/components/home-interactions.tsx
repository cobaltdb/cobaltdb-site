// biome-ignore-all lint/a11y/noNoninteractiveTabindex: WAI-ARIA tab panels and horizontally scrollable code need keyboard access.
"use client";
import { useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Database,
  HardDrive,
  Network,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { CodeBlock, CopyButton, Highlight } from "./code";
import { heroGoCode, INSTALL, serverCode } from "@/lib/site";

function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
  const tabs = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    ) ?? [],
  );
  const index = tabs.indexOf(event.currentTarget);
  let next = index;
  if (event.key === "ArrowDown" || event.key === "ArrowRight")
    next = (index + 1) % tabs.length;
  else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
    next = (index - 1 + tabs.length) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}

export function InstallCommand() {
  return (
    <div className="install-command">
      <Terminal size={15} />
      <code>
        <span>$</span> {INSTALL}
      </code>
      <CopyButton text={INSTALL} label="Copy install command" />
    </div>
  );
}

export function QuickStart() {
  const [mode, setMode] = useState("embedded");
  return (
    <div className="quick-start">
      <div className="quick-info">
        <span className="eyebrow">LESS SETUP. MORE BUILDING.</span>
        <h2>
          Your next idea.
          <br />
          Already connected.
        </h2>
        <p>
          Go from import to your first query.
          <br />
          Pick the way you want to build.
        </p>
        <div className="mode-tabs" role="tablist" aria-label="Deployment mode">
          {[
            {
              id: "embedded",
              icon: Code2,
              name: "Embed in Go",
              detail: "Runs inside your application",
            },
            {
              id: "server",
              icon: Network,
              name: "Run as a server",
              detail: "Connect with a MySQL client",
            },
          ].map((m) => (
            <button
              type="button"
              key={m.id}
              id={`mode-${m.id}`}
              role="tab"
              aria-selected={mode === m.id}
              tabIndex={mode === m.id ? 0 : -1}
              onKeyDown={navigateTabs}
              aria-controls="mode-panel"
              onClick={() => setMode(m.id)}
            >
              <m.icon size={21} />
              <span>
                <strong>{m.name}</strong>
                <small>{m.detail}</small>
              </span>
              {mode === m.id ? <Check size={17} /> : <ChevronRight size={17} />}
            </button>
          ))}
        </div>
        <Link
          href={`/docs/${mode === "embedded" ? "getting-started" : "server"}/`}
          className="text-link"
        >
          Walk through the quick start
          <ArrowRight size={16} />
        </Link>
      </div>
      <div
        id="mode-panel"
        role="tabpanel"
        aria-labelledby={`mode-${mode}`}
        tabIndex={0}
      >
        <CodeBlock
          code={mode === "embedded" ? heroGoCode : serverCode}
          title={mode === "embedded" ? "main.go" : "terminal"}
          language={mode === "embedded" ? "Go" : "bash"}
        />
        <div className="code-footnote">
          <span className="status-dot" />
          {mode === "embedded"
            ? "Your process. Your data. No database server required."
            : "A familiar protocol. A different kind of database."}
        </div>
      </div>
    </div>
  );
}

const examples = [
  {
    id: "sql",
    name: "Familiar SQL",
    label: "Relational, without the ceremony.",
    description:
      "Tables, joins, indexes and the SQL you already know. Keep your data structured and your queries expressive.",
    code: `SELECT name, language, stars
FROM projects
WHERE language = 'Go'
ORDER BY stars DESC
LIMIT 3;`,
    columns: ["name", "language", "stars"],
    rows: [
      ["cobaltdb", "Go", "1,280"],
      ["atlas", "Go", "864"],
      ["lumen", "Go", "512"],
    ],
  },
  {
    id: "json",
    name: "Flexible JSON",
    label: "Structured meets flexible.",
    description:
      "Store JSON alongside relational data. Extract the fields you need without giving up your SQL workflow.",
    code: `SELECT name,
  JSON_EXTRACT(metadata, '$.region') AS region
FROM projects
WHERE JSON_EXTRACT(metadata, '$.active') = true;`,
    columns: ["name", "region"],
    rows: [
      ["cobaltdb", "eu-west"],
      ["atlas", "us-east"],
      ["lumen", "ap-south"],
    ],
  },
  {
    id: "transactions",
    name: "ACID transactions",
    label: "Every change, together.",
    description:
      "Commit related changes as one transaction. If something goes wrong, roll back and keep your data consistent.",
    code: `BEGIN;
UPDATE accounts SET balance = balance - 100
WHERE id = 1;
UPDATE accounts SET balance = balance + 100
WHERE id = 2;
COMMIT;`,
    columns: ["id", "account", "balance"],
    rows: [
      ["1", "Sender", "900"],
      ["2", "Recipient", "1,100"],
    ],
  },
];

export function QueryExplorer() {
  const [active, setActive] = useState(0);
  const example = examples[active];
  return (
    <div className="query-explorer">
      <div className="query-copy">
        <span className="eyebrow">THE GOOD PARTS, BUILT IN</span>
        <h2>
          Real SQL.
          <br />
          Room for more.
        </h2>
        <p>{example.description}</p>
        <div className="query-tabs" role="tablist" aria-label="Query examples">
          {examples.map((e, i) => (
            <button
              type="button"
              role="tab"
              id={`query-${e.id}`}
              aria-controls="query-panel"
              aria-selected={active === i}
              tabIndex={active === i ? 0 : -1}
              onKeyDown={navigateTabs}
              key={e.id}
              onClick={() => setActive(i)}
            >
              <span>0{i + 1}</span>
              {e.name}
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        <Link className="text-link" href="/docs/sql/">
          Explore the SQL reference
          <ArrowRight size={16} />
        </Link>
      </div>
      <div
        id="query-panel"
        role="tabpanel"
        aria-labelledby={`query-${example.id}`}
        tabIndex={0}
        className="query-window"
      >
        <div className="query-window-bar">
          <span>
            <Database size={14} /> workspace.db
          </span>
          <span className="read-only-label">EXAMPLE EXPLORER</span>
        </div>
        <div className="query-editor">
          <div className="query-editor-title">
            <span>query.sql</span>
            <CopyButton text={example.code} />
          </div>
          <pre tabIndex={0}>
            <code>
              <Highlight code={example.code} />
            </code>
          </pre>
        </div>
        <div className="query-results">
          <div className="results-title">
            <span>
              <Check size={13} />
              Sample output
            </span>
            <span>{example.rows.length} rows</span>
          </div>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                {example.label} Illustrative sample data.
              </caption>
              <thead>
                <tr>
                  {example.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {example.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="query-disclaimer">
          Illustrative data · Examples are not executed in your browser.
        </div>
      </div>
    </div>
  );
}

export function StorageDiagram() {
  return (
    <div
      className="storage-diagram"
      role="img"
      aria-label="SQL flows through the query engine to the buffer pool, B+ tree and write-ahead log"
    >
      <div className="diagram-input">
        <code>SELECT * FROM ideas;</code>
        <ArrowRight size={15} />
      </div>
      <div className="diagram-engine">
        <Database size={23} />
        <span>CobaltDB engine</span>
        <span className="diagram-pill">Pure Go</span>
      </div>
      <div className="diagram-branches">
        <div>
          <HardDrive size={19} />
          <strong>B+ tree</strong>
          <small>Indexed storage</small>
        </div>
        <div>
          <Terminal size={19} />
          <strong>WAL</strong>
          <small>Durable writes</small>
        </div>
      </div>
      <span className="diagram-bottom">
        A small surface. A complete storage engine.
      </span>
    </div>
  );
}
