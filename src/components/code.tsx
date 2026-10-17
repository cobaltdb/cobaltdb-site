"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  text,
  label = "Copy code",
}: {
  text: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
    }
  }
  return (
    <button
      type="button"
      className="copy-button"
      onClick={copy}
      aria-label={status === "copied" ? "Copied" : label}
      title={label}
    >
      {status === "copied" ? <Check size={15} /> : <Copy size={15} />}
      <span role="status">
        {status === "copied"
          ? "Copied!"
          : status === "error"
            ? "Select and copy"
            : ""}
      </span>
    </button>
  );
}

export function Highlight({ code }: { code: string }) {
  const tokens = code.split(
    /("[^"\n]*"|'[^'\n]*'|`[^`]*`|\/\/[^\n]*|#[^\n]*|--[^\n]*|\b(?:SELECT|FROM|WHERE|ORDER BY|DESC|AS|CREATE TABLE|INSERT INTO|VALUES|BEGIN|COMMIT|UPDATE|SET|INTEGER|TEXT|JSON|PRIMARY KEY|NOT NULL|LIMIT|GROUP BY|JOIN|ON|SUM|JSON_EXTRACT|func|package|import|defer|if|nil|for|return)\b|\b\d+(?:\.\d+)?\b)/g,
  );
  return (
    <>
      {tokens.map((token, i) => (
        <span
          key={i}
          className={
            /^(\/\/|#|--)/.test(token)
              ? "syntax-comment"
              : /^["'`]/.test(token)
                ? "syntax-string"
                : /^(?:\d)/.test(token)
                  ? "syntax-number"
                  : /^(?:[A-Z][A-Z_ ]*|func|package|import|defer|if|nil|for|return)$/.test(
                        token,
                      )
                    ? "syntax-keyword"
                    : undefined
          }
        >
          {token}
        </span>
      ))}
    </>
  );
}

export function CodeBlock({
  code,
  title = "terminal",
  language = "bash",
}: {
  code: string;
  title?: string;
  language?: string;
}) {
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>
          <span className="terminal-dot" />
          {title}
        </span>
        <span className="code-actions">
          {language}
          <CopyButton text={code} />
        </span>
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Horizontally scrollable code must be keyboard accessible. */}
      <pre role="region" tabIndex={0} aria-label={`${title} code`}>
        <code>
          <Highlight code={code} />
        </code>
      </pre>
    </div>
  );
}
