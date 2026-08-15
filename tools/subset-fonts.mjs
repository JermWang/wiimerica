/* Subsets the Wii UI fonts down to the characters this site actually uses,
   then writes WOFF2. The source TTFs are full Japanese Gothic faces
   (8600+ glyphs, 2.4 MB); the site only ever renders Latin.

   Run:  npm run fonts        (needs: npm i --no-save subset-font)          */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, "tools", "font-src");
const outDir = path.join(root, "assets", "fonts");

// Latin-1 printable range, plus the punctuation the UI uses.
let chars = "";
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCharCode(c);
chars += " —–‘’“”…•→←×·°©®™€£¥";

for (const [src, out] of [["main.ttf", "main.woff2"], ["clock.ttf", "clock.woff2"]]) {
  const buf = await readFile(path.join(srcDir, src));
  const sub = await subsetFont(buf, chars, { targetFormat: "woff2" });
  await writeFile(path.join(outDir, out), sub);
  console.log(
    `${src} ${(buf.length / 1024).toFixed(0)}KB  ->  ${out} ${(sub.length / 1024).toFixed(1)}KB`
  );
}
