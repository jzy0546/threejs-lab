import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legacyRoutes } from "./migration-routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

const fail = (message) => {
  throw new Error(message);
};

const outputFor = (route) =>
  route === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, route.replace(/^\/|\/$/g, ""), "index.html");

for (const entry of legacyRoutes) {
  const file = outputFor(entry.route);
  await stat(file);
  const content = await readFile(file, "utf8");
  if (!/<meta name="robots" content="noindex,follow">/.test(content)) {
    fail(`${entry.route} is missing noindex,follow`);
  }
  if (!content.includes(`<link rel="canonical" href="${entry.target}">`)) {
    fail(`${entry.route} has the wrong canonical target`);
  }
  if (!content.includes(`content="5;url=${entry.target}"`)) {
    fail(`${entry.route} has the wrong meta refresh target`);
  }
  if (!content.includes("window.location.search + window.location.hash")) {
    fail(`${entry.route} does not preserve query and hash`);
  }
  if (/adsbygoogle|googlesyndication|gtag\(/i.test(content)) {
    fail(`${entry.route} must not contain advertising or analytics scripts`);
  }
  const h1s = [...content.matchAll(/<h1\b[^>]*>/g)];
  if (h1s.length !== 1) fail(`${entry.route} must contain one h1`);
}

const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
if (!/Allow: \//.test(robots) || /Sitemap:/i.test(robots)) {
  fail("robots.txt must allow crawling noindex shells and omit a legacy sitemap");
}

for (const file of [path.join(distDir, "404.html"), path.join(distDir, "404", "index.html")]) {
  const content = await readFile(file, "utf8");
  if (!/noindex,follow/.test(content)) fail(`${path.basename(file)} must be noindex`);
}

console.log(`Checked ${legacyRoutes.length} migration shells and the legacy 404.`);
