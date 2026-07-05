import { initSite } from "./shared/site.js";
import { THREE, addGrid, createRenderer, resizeRenderer, runScene } from "./shared/three-utils.js";

initSite();

const canvas = document.querySelector("#fov-canvas");
const inputs = {
  height: document.querySelector("#object-height"),
  distance: document.querySelector("#camera-distance"),
  aspect: document.querySelector("#aspect-ratio"),
  margin: document.querySelector("#frame-margin")
};
const outputs = {
  vertical: document.querySelector("#vertical-fov"),
  horizontal: document.querySelector("#horizontal-fov"),
  width: document.querySelector("#visible-width"),
  snippet: document.querySelector("#fov-code")
};

let scene;
let camera;
let renderer;
let object;
let frame;

if (canvas) {
  const container = canvas.parentElement;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f6fb);
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  renderer = createRenderer(canvas, { exposure: 1 });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x223040, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(3, 4, 6);
  scene.add(key);
  addGrid(scene, 8);

  object = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x2f8f83, roughness: 0.48, metalness: 0.08 })
  );
  object.position.y = 0.5;
  scene.add(object);

  frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 0.02)),
    new THREE.LineBasicMaterial({ color: 0x151b24 })
  );
  frame.position.y = 0.5;
  scene.add(frame);

  window.addEventListener("resize", () => update());
  runScene(() => {
    resizeRenderer(renderer, null, container);
    renderer.render(scene, camera);
  });
}

Object.values(inputs).forEach((input) => input?.addEventListener("input", update));
update();

function update() {
  const objectHeight = clampNumber(inputs.height?.value, 0.1, 100, 2);
  const distance = clampNumber(inputs.distance?.value, 0.1, 500, 6);
  const aspect = clampNumber(inputs.aspect?.value, 0.2, 5, 16 / 9);
  const margin = clampNumber(inputs.margin?.value, 0, 100, 12);
  const framedHeight = objectHeight * (1 + margin / 100);
  const verticalFov = radiansToDegrees(2 * Math.atan(framedHeight / (2 * distance)));
  const horizontalFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(verticalFov) / 2) * aspect));
  const visibleWidth = framedHeight * aspect;

  outputs.vertical.textContent = `${verticalFov.toFixed(2)} deg`;
  outputs.horizontal.textContent = `${horizontalFov.toFixed(2)} deg`;
  outputs.width.textContent = visibleWidth.toFixed(2);
  outputs.snippet.textContent = buildSnippet(objectHeight, distance, aspect, margin, verticalFov);

  if (camera && object && frame) {
    const container = canvas.parentElement;
    resizeRenderer(renderer, null, container);
    camera.aspect = aspect;
    camera.fov = verticalFov;
    camera.position.set(0, objectHeight / 2, distance);
    camera.lookAt(0, objectHeight / 2, 0);
    camera.updateProjectionMatrix();
    object.scale.set(objectHeight * 0.55, objectHeight, objectHeight * 0.55);
    object.position.y = objectHeight / 2;
    frame.scale.set(visibleWidth, framedHeight, 1);
    frame.position.y = objectHeight / 2;
  }
}

function buildSnippet(objectHeight, distance, aspect, margin, fov) {
  return `const objectHeight = ${objectHeight};
const distance = ${distance};
const aspect = ${aspect};
const margin = ${margin} / 100;

const framedHeight = objectHeight * (1 + margin);
const fov = THREE.MathUtils.radToDeg(
  2 * Math.atan(framedHeight / (2 * distance))
);

camera.fov = ${fov.toFixed(2)};
camera.aspect = aspect;
camera.position.set(0, objectHeight / 2, distance);
camera.lookAt(0, objectHeight / 2, 0);
camera.updateProjectionMatrix();`;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value) {
  return (value * 180) / Math.PI;
}
