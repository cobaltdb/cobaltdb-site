import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve("out");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
const port = Number(process.env.PORT || 3000);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    } catch {
      file = resolve(root, "404.html");
      res.statusCode = 404;
    }
    let data = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Vary", "Accept-Encoding");
    if (
      /\bgzip\b/.test(req.headers["accept-encoding"] ?? "") &&
      /\.(html|css|js|json|svg|txt|xml)$/.test(file)
    ) {
      data = gzipSync(data);
      res.setHeader("Content-Encoding", "gzip");
    }
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(400).end("Bad request");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`CobaltDB preview: http://localhost:${port}`),
);
