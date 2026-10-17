import { copyFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Next.js #85374: Windows exports some RSC segments into directories instead
// of dot-separated filenames. Publish the names requested by the browser.
// Linux output is already flat, so this step is a no-op there.
async function normalize(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const child = join(directory, entry.name);
    if (entry.name.startsWith("__next.")) {
      const files = await readdir(child, {
        recursive: true,
        withFileTypes: true,
      });
      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".txt")) continue;
        const relative = join(file.parentPath, file.name).slice(
          child.length + 1,
        );
        const name = `${entry.name}.${relative.replaceAll(/[/\\]/g, ".")}`;
        await copyFile(join(file.parentPath, file.name), join(directory, name));
      }
    } else await normalize(child);
  }
}
await normalize("out");
console.log("Static export verified: platform-independent RSC filenames.");
