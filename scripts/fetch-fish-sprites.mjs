#!/usr/bin/env node
// Downloads every fish sprite referenced by data/fish.json from the Stardew
// Valley wiki into public/fish/<id>.png. Same md5-path strategy as
// fetch-sprites.mjs. Idempotent: an existing valid PNG is left untouched.

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { get } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data", "fish.json");
const OUT_DIR = join(ROOT, "public", "fish");

// fish id -> exact wiki file name, when it differs from Name-with-underscores.
const OVERRIDES = {};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const isPng = (buf) => buf && buf.length > 4 && buf.subarray(0, 4).equals(PNG_MAGIC);

function wikiFileFor(id, name) {
  if (OVERRIDES[id]) return OVERRIDES[id];
  return name.replace(/ /g, "_") + ".png";
}

function imageUrl(wikiFile) {
  const h = createHash("md5").update(wikiFile).digest("hex");
  return `https://stardewvalleywiki.com/mediawiki/images/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(wikiFile)}`;
}

function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        if (redirectsLeft <= 0) return reject(new Error("too many redirects"));
        return resolve(fetchBuffer(new URL(headers.location, url).toString(), redirectsLeft - 1));
      }
      if (statusCode !== 200) {
        res.resume();
        return reject(new Error("HTTP " + statusCode));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const data = JSON.parse(readFileSync(DATA, "utf8"));
  const sprites = data.fish.map((f) => ({
    id: f.sprite.split("/").pop().replace(/\.png$/, ""),
    name: f.name,
  }));

  let downloaded = 0;
  let skipped = 0;
  const failed = [];

  for (const { id, name } of sprites) {
    const dest = join(OUT_DIR, id + ".png");
    if (existsSync(dest) && statSync(dest).size > 0 && isPng(readFileSync(dest))) {
      skipped++;
      continue;
    }
    const wikiFile = wikiFileFor(id, name);
    try {
      const buf = await fetchBuffer(imageUrl(wikiFile));
      if (!isPng(buf)) {
        failed.push({ id, name, wikiFile, reason: "not a PNG (got HTML/error)" });
        continue;
      }
      writeFileSync(dest, buf);
      downloaded++;
      console.log(`ok   ${id}  <-  ${wikiFile}  (${buf.length} bytes)`);
    } catch (err) {
      failed.push({ id, name, wikiFile, reason: err.message });
    }
  }

  console.log("\n=== Summary ===");
  console.log(`unique sprites : ${sprites.length}`);
  console.log(`downloaded     : ${downloaded}`);
  console.log(`already valid  : ${skipped}`);
  console.log(`failed         : ${failed.length}`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(`  ${f.id}  (name="${f.name}", tried="${f.wikiFile}")  -> ${f.reason}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
