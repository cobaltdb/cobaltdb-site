export const REPO = "https://github.com/cobaltdb/cobaltdb";
export const VERSION = "0.6.1";
export const INSTALL = "go get github.com/cobaltdb/cobaltdb";
export const embeddedCode = `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/cobaltdb/cobaltdb/pkg/engine"
)

func main() {
    db, err := engine.Open(":memory:", &engine.Options{InMemory: true})
    if err != nil { log.Fatal(err) }
    defer db.Close()

    ctx := context.Background()
    _, err = db.Exec(ctx,
        "CREATE TABLE IF NOT EXISTS greetings (message TEXT)")
    if err != nil { log.Fatal(err) }

    _, err = db.Exec(ctx,
        "INSERT INTO greetings VALUES (?)", "Hello, CobaltDB!")
    if err != nil { log.Fatal(err) }

    rows, err := db.Query(ctx, "SELECT * FROM greetings")
    if err != nil { log.Fatal(err) }
    defer rows.Close()
    for rows.Next() {
        var message string
        if err := rows.Scan(&message); err != nil { log.Fatal(err) }
        fmt.Println(message)
    }
}`;
export const heroGoCode = `db, err := engine.Open("app.db", nil)
if err != nil { log.Fatal(err) }
defer db.Close()

ctx := context.Background()
rows, err := db.Query(ctx,
    "SELECT name FROM projects WHERE stars > ?", 100)
if err != nil { log.Fatal(err) }
defer rows.Close()`;
export const serverCode = `# Build the server from source
git clone https://github.com/cobaltdb/cobaltdb.git
cd cobaltdb
go build -o cobaltdb-server ./cmd/cobaltdb-server

# Local development: choose a strong admin password
export COBALTDB_ADMIN_PASSWORD='your-strong-password'
./cobaltdb-server -mysql-addr 127.0.0.1:3307 -data ./data

# Connect in another terminal
mysql -h 127.0.0.1 -P 3307 -u admin -p`;

export const docPages = [
  {
    slug: "getting-started",
    title: "Getting started",
    group: "Start here",
    description: "Install CobaltDB and run your first SQL query in Go.",
  },
  {
    slug: "sql",
    title: "SQL & JSON",
    group: "Build",
    description:
      "Tables, indexes, parameterized queries, JSON and transactions.",
  },
  {
    slug: "architecture",
    title: "Architecture",
    group: "Build",
    description:
      "Understand the query engine, B+ tree storage and write-ahead log.",
  },
  {
    slug: "server",
    title: "Server & clients",
    group: "Deploy",
    description:
      "Run the standalone server and connect over the MySQL wire protocol.",
  },
  {
    slug: "production",
    title: "Production guide",
    group: "Deploy",
    description:
      "Plan TLS, security, backups, observability and deployment boundaries.",
  },
] as const;

export const searchItems = [
  ...docPages.map((p) => ({
    title: p.title,
    description: p.description,
    href: `/docs/${p.slug}/`,
  })),
  {
    title: "Performance benchmarks",
    description: "B+ tree and SQL benchmark results, methodology and hardware.",
    href: "/#benchmarks",
  },
  {
    title: "Features",
    description: "SQL, transactions, encryption and a pure Go runtime.",
    href: "/#features",
  },
  {
    title: "Brand assets",
    description: "Download the CobaltDB SVG logo and icon.",
    href: "/brand/",
  },
];
