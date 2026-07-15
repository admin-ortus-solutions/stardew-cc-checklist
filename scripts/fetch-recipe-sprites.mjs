#!/usr/bin/env node
// Downloads every recipe sprite referenced by data/cooking.json and
// data/crafting.json from the Stardew Valley wiki into public/recipes/<id>.png.
//
// Same strategy as fetch-sprites.mjs: the wiki file name is usually the recipe
// name with spaces -> underscores plus ".png"; exceptions live in OVERRIDES
// (keyed by recipe id). MediaWiki stores uploads at
// /mediawiki/images/<h0>/<h0h1>/<File> where h = md5(filename).
//
// Idempotent: an existing valid PNG is left untouched.

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { get } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCES = [join(ROOT, "data", "cooking.json"), join(ROOT, "data", "crafting.json")];
const OUT_DIR = join(ROOT, "public", "recipes");

// recipe id -> exact wiki file name, for recipes whose wiki filename is not
// just "<Recipe Name with spaces as underscores>.png".
const OVERRIDES = {
  // Cooking (apostrophes — name-based usually works but pinned for safety)
  "autumns-bounty": "Autumn's_Bounty.png",
  "farmers-lunch": "Farmer's_Lunch.png",
  "dish-o-the-sea": "Dish_O'_The_Sea.png",
  "miners-treat": "Miner's_Treat.png",
  // Crafting
  "speed-gro": "Speed-Gro.png",
  "deluxe-speed-gro": "Deluxe_Speed-Gro.png",
  "hyper-speed-gro": "Hyper_Speed-Gro.png",
  "ring-of-yoba": "Ring_of_Yoba.png",
  "oil-of-garlic": "Oil_of_Garlic.png",
  "wood-lamp-post": "Wood_Lamp-post.png",
  "iron-lamp-post": "Iron_Lamp-post.png",
  "jack-o-lantern": "Jack-O-Lantern.png",
  "slime-egg-press": "Slime_Egg-Press.png",
  "tub-o-flowers": "Tub_o'_Flowers.png",
  "transmute-fe": "Iron_Bar.png", // no icon of its own; reuses the bar it makes
  "transmute-au": "Gold_Bar.png",
  "mini-jukebox": "Mini-Jukebox.png",
  "mini-obelisk": "Mini-Obelisk.png",
  "mini-forge": "Mini-Forge.png",
  "warp-totem-beach": "Warp_Totem_Beach.png", // colon in name, not in wiki file
  "warp-totem-mountains": "Warp_Totem_Mountains.png",
  "warp-totem-farm": "Warp_Totem_Farm.png",
  "warp-totem-desert": "Warp_Totem_Desert.png",
  "warp-totem-island": "Warp_Totem_Island.png",
};

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

function uniqueSprites() {
  const map = new Map(); // id -> { id, name }
  for (const src of SOURCES) {
    const data = JSON.parse(readFileSync(src, "utf8"));
    for (const r of data.recipes) {
      const id = r.sprite.split("/").pop().replace(/\.png$/, "");
      if (!map.has(id)) map.set(id, { id, name: r.name });
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
