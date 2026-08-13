import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legacyRoutes } from "./migration-routes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const customDomain = (process.env.CUSTOM_DOMAIN || "threejs.vavist.com").trim();

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const outputFor = (route) =>
  route === "/"
    ? path.join(distDir, "index.html")
    : path.join(distDir, route.replace(/^\/|\/$/g, ""), "index.html");

const renderShell = ({ route, target, label }) => {
  const title = `${label} has moved to Vavist`;
  const description = `${label} now lives on the maintained Vavist main domain. This legacy page links to the current tool, guide, or policy page.`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${escapeHtml(target)}">
  <meta http-equiv="refresh" content="5;url=${escapeHtml(target)}">
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: #10100e; color: #f4efe4; }
    main { width: min(100%, 680px); padding: clamp(28px, 7vw, 64px); border: 1px solid #39372f; background: #181713; }
    p { max-width: 62ch; color: #c8c1b4; line-height: 1.7; }
    a { color: #10100e; background: #65d8c2; display: inline-block; margin-top: 18px; padding: 13px 18px; font-weight: 700; text-decoration: none; }
    small { display: block; margin-top: 24px; color: #948e82; }
  </style>
</head>
<body>
  <main>
    <p>Three.js Lab migration</p>
    <h1>${escapeHtml(label)} has moved.</h1>
    <p>The maintained page now lives on <strong>vavist.com</strong>. Vavist marks this legacy URL noindex and keeps it available so readers can reach the current page.</p>
    <a id="continue-link" href="${escapeHtml(target)}">Continue to ${escapeHtml(label)}</a>
    <small>You will be redirected in five seconds. Query parameters and the URL fragment are preserved by the browser redirect.</small>
  </main>
  <script>
    (() => {
      const target = ${JSON.stringify(target)};
      const destination = target + window.location.search + window.location.hash;
      document.querySelector("#continue-link").href = destination;
      window.setTimeout(() => window.location.replace(destination), 5000);
    })();
  </script>
</body>
</html>`;
};

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const entry of legacyRoutes) {
  const output = outputFor(entry.route);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, renderShell(entry), "utf8");
}

const notFound = renderShell({
  route: "/404/",
  target: "https://vavist.com/tools/",
  label: "Three.js Lab"
});
await mkdir(path.join(distDir, "404"), { recursive: true });
await writeFile(path.join(distDir, "404", "index.html"), notFound, "utf8");
await writeFile(path.join(distDir, "404.html"), notFound, "utf8");
await writeFile(
  path.join(distDir, "robots.txt"),
  "User-agent: *\nAllow: /\n",
  "utf8"
);
if (customDomain) await writeFile(path.join(distDir, "CNAME"), `${customDomain}\n`, "utf8");

console.log(`Built ${legacyRoutes.length} migration shells plus a noindex 404.`);
