import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const dist = join(process.cwd(), "dist");
const siteUrl = cleanUrl(process.env.SITE_URL || "https://threejs.vavist.com");
const customDomain = process.env.CUSTOM_DOMAIN;
const gaId = process.env.GA_MEASUREMENT_ID;
const adsenseClient = process.env.ADSENSE_CLIENT;
const adsTxtAccount = process.env.ADS_TXT_ACCOUNT;

const routes = [
  "/",
  "/gltf-viewer/",
  "/camera-fov/",
  "/shader-starter/",
  "/lighting-presets/",
  "/examples/",
  "/three-js-particles/",
  "/three-js-rotating-object/",
  "/three-js-shader-material-example/",
  "/three-js-fit-camera-to-object/",
  "/three-js-gltfloader-example/",
  "/about/",
  "/contact/",
  "/privacy-policy/",
  "/terms-of-use/",
  "/cookie-policy/"
];

await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  "utf8"
);

await writeFile(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
  "utf8"
);

if (customDomain) {
  await writeFile(join(dist, "CNAME"), `${customDomain}\n`, "utf8");
}

if (adsTxtAccount) {
  await writeFile(join(dist, "ads.txt"), `google.com, ${adsTxtAccount}, DIRECT, f08c47fec0942fa0\n`, "utf8");
}

const htmlFiles = await listHtml(dist);
for (const file of htmlFiles) {
  let html = await readFile(file, "utf8");
  html = html.replaceAll("https://threejs.vavist.com", siteUrl);
  html = moveStylesheetsBeforeScripts(html);
  html = ensureRobotsMeta(html);
  html = ensureOpenGraphSiteName(html);
  html = ensureTwitterMeta(html);
  html = ensureJsonLd(html);
  html = injectBeforeHead(html, buildAnalyticsSnippet(gaId));
  html = injectBeforeHead(html, buildAdsenseSnippet(adsenseClient));
  await writeFile(file, html, "utf8");
}

console.log(`Postbuild complete for ${routes.length} routes.`);

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

function injectBeforeHead(html, snippet) {
  if (!snippet || html.includes(snippet.trim().slice(0, 24))) return html;
  return html.replace("</head>", `${snippet}\n  </head>`);
}

function moveStylesheetsBeforeScripts(html) {
  const styleLinks = [...html.matchAll(/\n\s*<link rel="stylesheet"[^>]+>/g)].map((match) => match[0]);
  if (!styleLinks.length) return html;
  let next = html;
  for (const link of styleLinks) {
    next = next.replace(link, "");
  }
  const firstModuleScript = next.match(/\n\s*<script type="module"[^>]+><\/script>/);
  if (firstModuleScript) {
    return next.replace(firstModuleScript[0], `${styleLinks.join("")}${firstModuleScript[0]}`);
  }
  return next.replace("</head>", `${styleLinks.join("")}\n  </head>`);
}

function ensureRobotsMeta(html) {
  if (/<meta\s+name="robots"/i.test(html)) return html;
  return html.replace("</head>", `    <meta name="robots" content="index,follow" />\n  </head>`);
}

function ensureOpenGraphSiteName(html) {
  if (/<meta\s+property="og:site_name"/i.test(html)) return html;
  return html.replace("</head>", `    <meta property="og:site_name" content="Three.js Lab" />\n  </head>`);
}

function ensureTwitterMeta(html) {
  if (/<meta\s+name="twitter:card"/i.test(html)) return html;
  const title = readTag(html, /<title>([^<]+)<\/title>/i);
  const description = readTag(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
  const twitter = `    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />`;
  return html.replace("</head>", `${twitter}\n  </head>`);
}

function ensureJsonLd(html) {
  if (/<script\s+type="application\/ld\+json"/i.test(html)) return html;
  const title = readTag(html, /<title>([^<]+)<\/title>/i);
  const description = readTag(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
  const url = readTag(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "Three.js Lab",
      url: `${siteUrl}/`
    }
  };
  return injectBeforeHead(html, `    <script type="application/ld+json">${JSON.stringify(data)}</script>`);
}

function readTag(html, regex) {
  return html.match(regex)?.[1]?.trim() || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildAnalyticsSnippet(id) {
  if (!id) return "";
  return `  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag("js", new Date());
      gtag("config", "${id}");
    </script>`;
}

function buildAdsenseSnippet(client) {
  if (!client) return "";
  return `  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`;
}

function cleanUrl(value) {
  return value.replace(/\/+$/, "");
}
