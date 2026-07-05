import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const port = 4179;
const baseUrl = `http://127.0.0.1:${port}`;
const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
const server = spawn(process.execPath, [viteBin, "preview", "--host", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: false
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch(getLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

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
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("h1").waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, route);
    await assertCanvasRendered(page, route);
  }

  await page.goto(`${baseUrl}/gltf-viewer/`, { waitUntil: "domcontentloaded" });
  await expectText(page, "#metric-meshes", /[1-9]/, "GLB viewer mesh metric");

  await page.goto(`${baseUrl}/camera-fov/`, { waitUntil: "domcontentloaded" });
  await expectText(page, "#fov-code", /camera\.fov/, "FOV code");

  await page.goto(`${baseUrl}/shader-starter/`, { waitUntil: "domcontentloaded" });
  await expectText(page, "#shader-code", /ShaderMaterial/, "shader code");

  await page.goto(`${baseUrl}/lighting-presets/`, { waitUntil: "domcontentloaded" });
  await expectText(page, "#lighting-code", /DirectionalLight/, "lighting code");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await assertNoHorizontalOverflow(page, "mobile home");

  await browser.close();

  if (consoleErrors.length) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }

  console.log("Smoke checks passed.");
} finally {
  server.kill();
}

async function waitForServer(url) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw new Error(`Server did not start. Output:\n${serverOutput}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`${label}: horizontal overflow ${overflow}px`);
}

async function assertCanvasRendered(page, label) {
  const canvases = await page.locator("canvas").count();
  if (!canvases) return;
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas || canvas.width < 20 || canvas.height < 20) return false;
    try {
      return canvas.toDataURL("image/png").length > 1000;
    } catch {
      return true;
    }
  });
  const dimensions = await page.locator("canvas").first().evaluate((canvas) => ({
    width: canvas.clientWidth,
    height: canvas.clientHeight
  }));
  if (dimensions.width < 120 || dimensions.height < 120) {
    throw new Error(`${label}: canvas too small ${dimensions.width}x${dimensions.height}`);
  }
}

async function expectText(page, selector, regex, label) {
  const text = await page.locator(selector).innerText();
  if (!regex.test(text)) throw new Error(`${label}: unexpected text "${text}"`);
}

function getLaunchOptions() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  const executablePath = candidates.find((candidate) => existsSync(candidate));
  return executablePath ? { executablePath } : {};
}
