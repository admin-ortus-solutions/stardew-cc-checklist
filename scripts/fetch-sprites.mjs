#!/usr/bin/env node
// Downloads every unique item sprite referenced by data/community-center.json
// from the Stardew Valley wiki into public/sprites/<slug>.png.
//
// Strategy: the wiki file name is usually the item name with spaces ->
// underscores plus ".png". Names whose wiki file differs live in OVERRIDES.
// MediaWiki stores each upload at /mediawiki/images/<h0>/<h0h1>/<File> where
// h = md5(filename). We build that path directly and fetch the PNG. (The
// Special:FilePath redirect endpoint sits behind a Cloudflare challenge; the
// image assets themselves do not, so we skip the redirect entirely.)
//
// Idempotent: an existing valid PNG is left untouched. Run again any time.

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { get } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data", "community-center.json");
const OUT_DIR = join(ROOT, "public", "sprites");

// slug -> exact wiki file name, for items whose wiki filename is not just
// "<Item Name with spaces as underscores>.png".
const OVERRIDES = {
  gold: "Gold.png", // Vault money bundles; dataset name is "2,500g"
  "large-egg-brown": "Large_Brown_Egg.png", // wiki names the brown variant differently
};

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function isPng(buf) {
  return buf && buf.length > PNG_MAGIC.length && buf.subarray(0, 4).equals(PNG_MAGIC);
}

function wikiFileFor(slug, name) {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  return name.replace(/ /g, "_") + ".png";
}

function imageUrl(wikiFile) {
  const h = createHash("md5").update(wikiFile).digest("hex");
  return `https://stardewvalleywiki.com/mediawiki/images/${h[0]}/${h[0]}${h[1]}/${encodeURIComponent(wikiFile)}`;
}

function fetchBuffer(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const req = get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      (res) => {
        const { statusCode, headers } = res;
        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          res.resume();
          if (redirectsLeft <= 0) return reject(new Error("too many redirects"));
          const next = new URL(headers.location, url).toString();
          return resolve(fetchBuffer(next, redirectsLeft - 1));
        }
        if (statusCode !== 200) {
          res.resume();
          return reject(new Error("HTTP " + statusCode));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
  });
}

function uniqueSprites() {
  const data = JSON.parse(readFileSync(DATA, "utf8"));
  const map = new Map(); // slug -> { name, slug }
  for (const room of data.rooms) {
    for (const bundle of room.bundles) {
      for (const item of bundle.items) {
        const slug = item.sprite.split("/").pop().replace(/\.png$/, "");
        if (!map.has(slug)) map.set(slug, { slug, name: item.name });
      }
    }
  }
  return [...map.values()];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const sprites = uniqueSprites();

  let downloaded = 0;
  let skipped = 0;
  const failed = [];

  for (const { slug, name } of sprites) {
    const dest = join(OUT_DIR, slug + ".png");
    if (existsSync(dest) && statSync(dest).size > 0) {
      try {
        const buf = readFileSync(dest);
        if (isPng(buf)) {
          skipped++;
          continue;
        }
      } catch {}
    }

    const wikiFile = wikiFileFor(slug, name);
    try {
      const buf = await fetchBuffer(imageUrl(wikiFile));
      if (!isPng(buf)) {
        failed.push({ slug, name, wikiFile, reason: "not a PNG (got HTML/error)" });
        continue;
      }
      writeFileSync(dest, buf);
      downloaded++;
      console.log(`ok   ${slug}  <-  ${wikiFile}  (${buf.length} bytes)`);
    } catch (err) {
      failed.push({ slug, name, wikiFile, reason: err.message });
    }
  }

  console.log("\n=== Summary ===");
  console.log(`unique sprites : ${sprites.length}`);
  console.log(`downloaded     : ${downloaded}`);
  console.log(`already valid  : ${skipped}`);
  console.log(`failed         : ${failed.length}`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) {
      console.log(`  ${f.slug}  (name="${f.name}", tried="${f.wikiFile}")  -> ${f.reason}`);
    }
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
