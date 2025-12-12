
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { resolve, dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const root = Deno.cwd();
const src = join(root, "src");

console.log("Searching for broken imports in src/...");

async function checkFile(path) {
  const content = await Deno.readTextFile(path);
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex for static imports
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      let importPath = match[1];

      // Skip node modules or URLs
      if (!importPath.startsWith(".")) continue;

      let absoluteImportPath = resolve(dirname(path), importPath);

      // Check if file exists (try .js, .ts, /index.js if it's a dir)
      let exists = false;
      try {
        await Deno.stat(absoluteImportPath);
        exists = true;
      } catch {
        try {
            await Deno.stat(absoluteImportPath + ".js");
            exists = true;
        } catch {
             try {
                await Deno.stat(join(absoluteImportPath, "index.js"));
                exists = true;
            } catch {}
        }
      }

      if (!exists) {
        console.log(`[BROKEN] ${path}:${i + 1} -> ${importPath}`);
      }
    }
  }
}

for await (const entry of walk(src, { includeDirs: false, exts: [".js", ".ts", ".jsx", ".tsx"] })) {
  await checkFile(entry.path);
}
