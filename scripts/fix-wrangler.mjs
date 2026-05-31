/* eslint-disable no-undef, no-console, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

// @astrojs/cloudflare v13 uses a "redirected wrangler.json" BETA mechanism
// that Cloudflare Pages CI rejects (main + pages_build_output_dir conflict,
// reserved ASSETS binding, etc.). Workaround: restructure output so Pages
// finds _worker.js directly without the redirect mechanism.

import { readFileSync, writeFileSync, cpSync, appendFileSync } from "fs";

cpSync("./dist/server", "./dist/client/server", {
  recursive: true,
  filter: (src) => !src.endsWith(".dev.vars"),
});

writeFileSync("./dist/client/_worker.js", `export { default } from './server/entry.mjs';\n`);

appendFileSync("./dist/client/.assetsignore", "\nserver/\n");

const src = JSON.parse(readFileSync("./dist/server/wrangler.json", "utf8"));
const pagesConfig = {
  name: src.name,
  pages_build_output_dir: "../client",
  compatibility_date: src.compatibility_date,
  compatibility_flags: src.compatibility_flags,
  observability: src.observability,
};
writeFileSync("./dist/server/wrangler.json", JSON.stringify(pagesConfig, null, 2));
console.log("fix-wrangler: done");
