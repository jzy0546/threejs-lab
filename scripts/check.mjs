import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";

const dist = join(process.cwd(), "dist");
if (!existsSync(dist)) {
  throw new Error("dist/ does not exist. Run npm run build first.");
}

const htmlFiles = await listHtml(dist);
const errors = [];

if (htmlFiles.length < 16) {
  errors.push(`Expected at least 16 HTML pages, found ${htmlFiles.length}.`);
}

for (const file of htmlFiles) {
  const rel = relative(process.cwd(), file);
  const html = await readFile(file, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] || "";
  const h1s = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/gi)];

  requireMatch(html, /<title>[^<]{8,}<\/title>/i, rel, "missing title");
  if (title.length < 30 || title.length > 70) {
    errors.push(`${rel}: title should be 30-70 characters, found ${title.length}`);
  }
  requireMatch(html, /<meta\s+name="description"\s+content="[^"]{40,}"/i, rel, "missing meta description");
  if (description.length < 80 || description.length > 170) {
    errors.push(`${rel}: description should be 80-170 characters, found ${description.length}`);
  }
  if (h1s.length !== 1) errors.push(`${rel}: should have exactly one h1, found ${h1s.length}`);
  if (canonicals.length !== 1) errors.push(`${rel}: should have exactly one canonical link, found ${canonicals.length}`);
  requireMatch(html, /<meta\s+name="robots"\s+content="index,follow"/i, rel, "missing index,follow robots meta");
  requireMatch(html, /<meta\s+name="twitter:card"\s+content="summary"/i, rel, "missing twitter card");
  requireMatch(html, /<meta\s+property="og:site_name"\s+content="Three\.js Lab"/i, rel, "missing og site name");
  const jsonBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  if (!jsonBlocks.length) {
    errors.push(`${rel}: missing JSON-LD`);
  }
  for (const block of jsonBlocks) {
    try {
      JSON.parse(block[1]);
    } catch {
      errors.push(`${rel}: invalid JSON-LD`);
    }
  }
  if (/[—–]/.test(html)) errors.push(`${rel}: contains em dash or en dash`);
  if (/TODO|TBD|lorem ipsum/i.test(html)) errors.push(`${rel}: contains placeholder text`);
}

for (const required of ["robots.txt", "sitemap.xml"]) {
  if (!existsSync(join(dist, required))) errors.push(`Missing ${required}.`);
}

const sitemap = existsSync(join(dist, "sitemap.xml")) ? await readFile(join(dist, "sitemap.xml"), "utf8") : "";
for (const route of [
  "/gltf-viewer/",
  "/camera-fov/",
  "/shader-starter/",
  "/lighting-presets/",
  "/examples/",
  "/three-js-particles/",
  "/three-js-rotating-object/",
  "/three-js-shader-material-example/",
  "/three-js-fit-camera-to-object/",
  "/three-js-gltfloader-example/"
]) {
  if (!sitemap.includes(route)) errors.push(`sitemap.xml missing ${route}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files.`);

async function listHtml(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listHtml(fullPath)));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

function requireMatch(html, regex, file, message) {
  if (!regex.test(html)) errors.push(`${file}: ${message}`);
}
