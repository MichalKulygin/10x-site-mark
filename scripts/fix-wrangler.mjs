import { readFileSync, writeFileSync, cpSync, appendFileSync } from "fs";

// @astrojs/cloudflare v13 uses a "redirected wrangler.json" BETA mechanism
// that Cloudflare Pages CI rejects because the generated config has
// conflicting fields (main + pages_build_output_dir, reserved ASSETS binding, etc.)
//
// Workaround: restructure the build output so Pages finds _worker.js directly.
// Pages automatically picks up _worker.js in the pages_build_output_dir as the
// SSR Worker, without needing any wrangler.json redirect.
//
// Steps:
//   1. Copy dist/server/ into dist/client/server/ (so Worker can import it)
//   2. Create dist/client/_worker.js that re-exports the Worker handler
//   3. Rewrite dist/server/wrangler.json with pages_build_output_dir = "../client"
//      (no "main" — Pages detects _worker.js automatically)

// 1. Copy server-side code into the client (Pages output) directory
cpSync("./dist/server", "./dist/client/server", {
  recursive: true,
  filter: (src) => !src.endsWith(".dev.vars"),
});
console.log("fix-wrangler: copied dist/server → dist/client/server");

// 2. Create _worker.js entry point in the Pages output directory
writeFileSync(
  "./dist/client/_worker.js",
  `export { default } from './server/entry.mjs';\n`
);
console.log("fix-wrangler: created dist/client/_worker.js");

// 3. Exclude the copied server directory from static asset serving
appendFileSync("./dist/client/.assetsignore", "\nserver/\n");
console.log("fix-wrangler: excluded server/ from static assets");

// 4. Rewrite dist/server/wrangler.json — Pages CI requires pages_build_output_dir
//    in the redirected config; without "main" it auto-detects _worker.js
const src = JSON.parse(readFileSync("./dist/server/wrangler.json", "utf8"));
const pagesConfig = {
  name: src.name,
  pages_build_output_dir: "../client",
  compatibility_date: src.compatibility_date,
  compatibility_flags: src.compatibility_flags,
  observability: src.observability,
};
writeFileSync("./dist/server/wrangler.json", JSON.stringify(pagesConfig, null, 2));
console.log("fix-wrangler: rewrote dist/server/wrangler.json →", JSON.stringify(pagesConfig));
