import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/code";
import { StorageDiagram } from "@/components/home-interactions";
import { embeddedCode, INSTALL, REPO, serverCode } from "./site";

export type DocSection = { id: string; title: string; content: ReactNode };
export const docContent: Record<string, DocSection[]> = {
  "getting-started": [
    {
      id: "install",
      title: "01. Add the module",
      content: (
        <>
          <p>
            CobaltDB’s embedded engine runs in your Go process. Use the current
            Go toolchain; the repository currently declares Go 1.26.0 and
            toolchain go1.26.6. No C compiler is required for the database
            runtime.
          </p>
          <CodeBlock
            code={`mkdir hello-cobalt\ncd hello-cobalt\ngo mod init example.com/hello-cobalt\n${INSTALL}`}
            title="Install CobaltDB"
          />
          <p>
            Import the engine from{" "}
            <code>github.com/cobaltdb/cobaltdb/pkg/engine</code>. The Go module
            resolves the library’s dependencies automatically.
          </p>
        </>
      ),
    },
    {
      id: "first-query",
      title: "02. Run your first query",
      content: (
        <>
          <p>
            Create a Go module, install CobaltDB, and save this complete program
            as <code>main.go</code>. It opens an in-memory database, creates a
            table, inserts a greeting and reads it back.
          </p>
          <CodeBlock code={embeddedCode} title="main.go" language="Go" />
          <CodeBlock code={"go mod tidy\ngo run ."} title="Run the example" />
          <div className="docs-callout">
            <strong>A clean start, every time.</strong> This example needs no
            files or server. Data is discarded when the program closes. Use
            persistent mode when your application needs data across restarts.
          </div>
        </>
      ),
    },
    {
      id: "persistence",
      title: "03. Choose your persistence mode",
      content: (
        <>
          <p>
            The example above uses in-memory mode. To persist data, open a file
            path with the default options. Keep the database and its WAL
            together, and validate durability and recovery on your deployment
            filesystem.
          </p>
          <CodeBlock
            code={
              'db, err := engine.Open("app.db", nil)\nif err != nil { log.Fatal(err) }\ndefer db.Close()'
            }
            title="Persistent mode"
            language="Go"
          />
        </>
      ),
    },
    {
      id: "next-steps",
      title: "Where to go next",
      content: (
        <>
          <p>
            Learn the <Link href="/docs/sql/">SQL and JSON workflow</Link>,
            explore the{" "}
            <Link href="/docs/architecture/">engine architecture</Link>, or{" "}
            <Link href="/docs/server/">run the standalone server</Link>.
          </p>
          <p>
            The engine’s current API is available in{" "}
            <a href={`${REPO}/tree/main/pkg/engine`}>pkg/engine on GitHub</a>.
            Check errors returned by every statement and close rows when you are
            finished.
          </p>
        </>
      ),
    },
  ],
  sql: [
    {
      id: "tables",
      title: "Tables & indexes",
      content: (
        <>
          <p>
            Start with familiar relational structures. CobaltDB supports SQL
            tables, primary keys, constraints and indexes. Use explicit IDs in
            this example so you can run each statement in sequence.
          </p>
          <CodeBlock
            language="SQL"
            title="Schema"
            code={`CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT,
    stars INTEGER,
    metadata JSON
);

CREATE INDEX idx_language ON projects(language);

INSERT INTO projects VALUES
    (1, 'cobaltdb', 'Go', 1280, '{"region":"eu-west"}'),
    (2, 'atlas', 'Go', 864, '{"region":"us-east"}');`}
          />
          <p>
            The names and numbers in these examples are illustrative data, not
            repository statistics.
          </p>
        </>
      ),
    },
    {
      id: "queries",
      title: "Queries & parameters",
      content: (
        <>
          <CodeBlock
            language="SQL"
            title="Find projects"
            code={`SELECT name, language, stars
FROM projects
WHERE language = 'Go'
ORDER BY stars DESC
LIMIT 10;`}
          />
          <p>
            In Go, bind values using <code>?</code> placeholders. Keep user
            input out of SQL string concatenation.
          </p>
          <CodeBlock
            language="Go"
            title="Parameterized query"
            code={`rows, err := db.Query(ctx,
    "SELECT name FROM projects WHERE stars > ?", 100)
if err != nil { log.Fatal(err) }
defer rows.Close()

for rows.Next() {
    var name string
    if err := rows.Scan(&name); err != nil { log.Fatal(err) }
    fmt.Println(name)
}`}
          />
        </>
      ),
    },
    {
      id: "json",
      title: "JSON, alongside your tables",
      content: (
        <>
          <p>
            Use a JSON column for fields that vary by record. Extract nested
            values while keeping the rest of the query relational.
          </p>
          <CodeBlock
            language="SQL"
            title="Read JSON fields"
            code={`SELECT name,
    JSON_EXTRACT(metadata, '$.region') AS region
FROM projects;

UPDATE projects
SET metadata = JSON_SET(metadata, '$.active', true)
WHERE id = 1;`}
          />
        </>
      ),
    },
    {
      id: "transactions",
      title: "Transactions",
      content: (
        <>
          <p>
            Group related statements with <code>BEGIN</code> and{" "}
            <code>COMMIT</code>. Use <code>ROLLBACK</code> when you need to
            discard the transaction.
          </p>
          <CodeBlock
            language="SQL"
            title="Atomic transfer"
            code={`CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance INTEGER);
INSERT INTO accounts VALUES (1, 1000), (2, 1000);

BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`}
          />
          <p>
            For application code, the engine also exposes{" "}
            <code>db.Begin()</code>, <code>tx.Exec()</code>,{" "}
            <code>tx.Commit()</code> and <code>tx.Rollback()</code>. Review
            current concurrency semantics for your workload before deployment.
          </p>
        </>
      ),
    },
    {
      id: "reference",
      title: "Keep the reference close",
      content: (
        <>
          <p>
            Read the{" "}
            <a href={`${REPO}/blob/main/docs/SQL.md`}>upstream SQL reference</a>{" "}
            for types and basic statements, and the{" "}
            <a href={`${REPO}/blob/main/docs/MYSQL_COMPATIBILITY.md`}>
              compatibility matrix
            </a>{" "}
            for tested SQL forms and protocol behavior.
          </p>
        </>
      ),
    },
  ],
  architecture: [
    {
      id: "overview",
      title: "One engine, two entry points",
      content: (
        <>
          <p>
            Embedded applications call the Go engine directly. The standalone
            server adds network protocols, authentication and operational
            services around the same database foundation.
          </p>
          <StorageDiagram />
          <p>
            The embedded path avoids a network round trip. The server path gives
            other processes a connection over the supported MySQL protocol
            surface.
          </p>
        </>
      ),
    },
    {
      id: "query",
      title: "From SQL to rows",
      content: (
        <>
          <table className="docs-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Responsibility</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Engine</td>
                <td>
                  Database lifecycle, query API and transaction entry points
                </td>
              </tr>
              <tr>
                <td>Query</td>
                <td>SQL lexing, parsing and statement representation</td>
              </tr>
              <tr>
                <td>Catalog</td>
                <td>Tables, expression evaluation and statement execution</td>
              </tr>
              <tr>
                <td>B+ tree</td>
                <td>Indexed key storage and lookup</td>
              </tr>
              <tr>
                <td>Storage</td>
                <td>Buffer pool, persistent pages and write-ahead logging</td>
              </tr>
            </tbody>
          </table>
          <p>
            The repository organizes these layers under{" "}
            <a href={`${REPO}/tree/main/pkg`}>pkg/</a>. Use that code and its
            regression tests as the authority for specific behavior.
          </p>
        </>
      ),
    },
    {
      id: "durability",
      title: "Durability & recovery",
      content: (
        <>
          <p>
            The persistent storage path uses a write-ahead log and
            checkpointing. Transaction commits and page flushing must preserve
            the ordering that allows recovery after interruption.
          </p>
          <p>
            Keep the database and associated files together. Use the supported
            backup facilities for consistent backups instead of copying a live
            database file by itself.
          </p>
          <div className="docs-callout">
            <strong>Pick the right persistence mode.</strong> In-memory mode is
            deliberately ephemeral. Measure persistent workloads separately from
            in-memory benchmarks.
          </div>
        </>
      ),
    },
    {
      id: "deeper",
      title: "Explore the internals",
      content: (
        <>
          <p>
            See{" "}
            <a href={`${REPO}/blob/main/ARCHITECTURE.md`}>
              the architecture overview
            </a>{" "}
            and{" "}
            <a href={`${REPO}/blob/main/docs/ARCHITECTURE_FULL.md`}>
              the detailed architecture guide
            </a>
            . For practical deployment boundaries, continue to the{" "}
            <Link href="/docs/production/">production guide</Link>.
          </p>
        </>
      ),
    },
  ],
  server: [
    {
      id: "build",
      title: "Build & start locally",
      content: (
        <>
          <p>
            Build the standalone server from the repository, bind the MySQL
            listener to loopback, and set your own admin password.
          </p>
          <CodeBlock code={serverCode} title="Local server workflow" />
          <p>
            This example uses a POSIX shell. In PowerShell, set the password
            with{" "}
            <code>$env:COBALTDB_ADMIN_PASSWORD = 'your-strong-password'</code>{" "}
            before starting the server. On Windows the binary is{" "}
            <code>cobaltdb-server.exe</code>.
          </p>
        </>
      ),
    },
    {
      id: "clients",
      title: "Connect from Go",
      content: (
        <>
          <p>
            The upstream compatibility suite covers the Go MySQL driver for
            ping, text queries and prepared statements. Use the driver’s
            configuration API to keep credentials out of connection-string
            concatenation.
          </p>
          <CodeBlock
            language="Go"
            title="MySQL driver configuration"
            code={`import (
    "database/sql"
    "os"
    "github.com/go-sql-driver/mysql"
)

cfg := mysql.NewConfig()
cfg.User = "admin"
cfg.Passwd = os.Getenv("COBALTDB_ADMIN_PASSWORD")
cfg.Net = "tcp"
cfg.Addr = "127.0.0.1:3307"

db, err := sql.Open("mysql", cfg.FormatDSN())
if err != nil { log.Fatal(err) }
defer db.Close()
if err := db.PingContext(ctx); err != nil { log.Fatal(err) }`}
          />
          <p>
            This configuration fragment belongs inside your Go application;
            install <code>github.com/go-sql-driver/mysql</code> and add your
            application’s context and logging imports.
          </p>
        </>
      ),
    },
    {
      id: "compatibility",
      title: "Compatibility, explicitly",
      content: (
        <>
          <p>
            The tested surface includes handshakes, text queries, result sets,
            error responses and parameterized prepared statements. CobaltDB does
            not promise the full behavior of a MySQL server.
          </p>
          <div className="docs-callout">
            <strong>Validate your client.</strong> Python, Node.js and Java SDK
            wrappers exist in the repository. Each production driver or ORM
            needs its own validation; the Go driver baseline is the explicitly
            covered integration.
          </div>
          <p>
            Read the{" "}
            <a href={`${REPO}/blob/main/docs/MYSQL_COMPATIBILITY.md`}>
              current compatibility matrix
            </a>{" "}
            for verified operations, metadata limitations and unlisted behavior.
          </p>
        </>
      ),
    },
    {
      id: "network",
      title: "Beyond local development",
      content: (
        <>
          <p>
            Keep listeners private and configure TLS for non-loopback access.
            Review server flags with <code>./cobaltdb-server -help</code>, then
            follow the <Link href="/docs/production/">production guide</Link>{" "}
            and upstream operational runbook.
          </p>
        </>
      ),
    },
  ],
  production: [
    {
      id: "scope",
      title: "Know the deployment boundary",
      content: (
        <>
          <p>
            CobaltDB currently describes itself as a production-oriented,
            single-node database candidate. Treat readiness as a property of
            your application, workload, driver and recovery process.
          </p>
          <div className="docs-callout">
            <strong>Replication is not automatic HA.</strong> The replication
            transport does not by itself provide automatic failover or high
            availability. Plan recovery and failover procedures explicitly.
          </div>
          <p>
            Read the upstream{" "}
            <a href={`${REPO}/blob/main/docs/PRODUCTION.md`}>
              production guide
            </a>{" "}
            and{" "}
            <a href={`${REPO}/blob/main/docs/HA_FAILOVER.md`}>
              HA and failover boundaries
            </a>{" "}
            before choosing a deployment architecture.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "Network & data security",
      content: (
        <>
          <ul>
            <li>
              Bind listeners to trusted interfaces and keep them private by
              default.
            </li>
            <li>
              Configure TLS for non-loopback wire access and validate client
              compatibility.
            </li>
            <li>
              Set a strong, unique admin password through your secret-management
              system.
            </li>
            <li>
              Evaluate AES-256-GCM encryption, RLS policies and audit logging
              for your data.
            </li>
            <li>
              Manage encryption keys independently from the data they protect.
            </li>
          </ul>
          <p>
            Non-loopback replication requires authenticated TLS. Mutual TLS and
            certificate-name overrides are available for relevant topologies.
            Use the current server configuration as the authority.
          </p>
        </>
      ),
    },
    {
      id: "backups",
      title: "Backups & restoration",
      content: (
        <>
          <p>
            Use CobaltDB’s supported backup APIs or CLI for online-consistent
            backups. A filesystem snapshot helper and an online backup are
            different workflows.
          </p>
          <p>
            Test restoration against a separate database before relying on a
            backup. Preserve required keys, metadata and operational
            configuration as part of your recovery plan.
          </p>
          <p>
            Refer to the{" "}
            <a href={`${REPO}/blob/main/docs/OPERATIONS_RUNBOOK.md`}>
              operations runbook
            </a>{" "}
            for the current procedures and deployment constraints.
          </p>
        </>
      ),
    },
    {
      id: "observability",
      title: "Health & observability",
      content: (
        <>
          <p>
            The health listener exposes liveness, readiness and metrics
            endpoints. Keep the operational listener private or behind your own
            access control.
          </p>
          <CodeBlock
            title="Local health checks"
            code={`curl http://127.0.0.1:8420/health
curl http://127.0.0.1:8420/ready
curl http://127.0.0.1:8420/metrics/prometheus`}
          />
          <p>
            Use representative workloads to set latency and resource budgets.
            Benchmark persistent storage, concurrency, failure recovery and the
            exact client versions you plan to ship.
          </p>
        </>
      ),
    },
    {
      id: "verification",
      title: "Verify the version you deploy",
      content: (
        <>
          <p>
            Pin your release, review the changelog, and run the repository’s
            verification commands in the appropriate development environment.
          </p>
          <CodeBlock
            title="Repository checks"
            code={`make verify

# Security/concurrency gate; race detector needs a CGO toolchain
make verify-security`}
          />
          <p>
            These commands are upstream database checks. Website build and
            browser checks do not certify database production readiness.
          </p>
        </>
      ),
    },
  ],
};
