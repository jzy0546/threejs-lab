import { initSite } from "./shared/site.js";
import {
  THREE,
  addGrid,
  createCamera,
  createOrbit,
  createRenderer,
  createSampleModel,
  resizeRenderer,
  runScene
} from "./shared/three-utils.js";

initSite();

const canvas = document.querySelector("#lighting-canvas");
const presetSelect = document.querySelector("#lighting-preset");
const exposureInput = document.querySelector("#lighting-exposure");
const code = document.querySelector("#lighting-code");

const presets = {
  studio: {
    label: "Studio product",
    background: 0xf2f6fb,
    hemi: [0xffffff, 0x263342, 1.7],
    lights: [
      ["key", 0xffffff, 2.8, [3, 4.5, 4]],
      ["rim", 0x8ff7e8, 1.2, [-4, 2.8, -3]]
    ]
  },
  softbox: {
    label: "Softbox neutral",
    background: 0xf7f8fb,
    hemi: [0xffffff, 0x425168, 2.2],
    lights: [
      ["leftSoftbox", 0xffffff, 1.8, [-3.8, 3.2, 2.6]],
      ["rightSoftbox", 0xdcecff, 1.2, [4, 2.3, 3.4]]
    ]
  },
  dusk: {
    label: "Dusk contrast",
    background: 0x182230,
    hemi: [0x9fb5ff, 0x12151c, 0.9],
    lights: [
      ["warmKey", 0xffd0a3, 2.3, [2.5, 3.8, 3]],
      ["coolRim", 0x6be2d0, 1.9, [-3.5, 2.2, -2.7]]
    ]
  },
  clay: {
    label: "Matte clay",
    background: 0xe8edf4,
    hemi: [0xffffff, 0x7b8794, 1.35],
    lights: [
      ["largeKey", 0xffffff, 2.1, [1.8, 5, 3.8]],
      ["fill", 0xbad7ff, 0.7, [-3, 1.8, 2]]
    ]
  }
};

let scene;
let camera;
let renderer;
let controls;
let model;
let lightGroup;

if (canvas) {
  const container = canvas.parentElement;
  scene = new THREE.Scene();
  camera = createCamera(container, [3.4, 2.3, 4.8]);
  renderer = createRenderer(canvas, { exposure: 1 });
  controls = createOrbit(camera, canvas, [0, 0.8, 0]);
  addGrid(scene, 8);
  model = createSampleModel();
  model.position.y = 0.9;
  scene.add(model);
  window.addEventListener("resize", () => resizeRenderer(renderer, camera, container));
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    if (!reduced) model.rotation.y = time * 0.00035;
    controls.update();
    renderer.render(scene, camera);
  });
}

presetSelect?.addEventListener("input", updatePreset);
exposureInput?.addEventListener("input", updatePreset);
updatePreset();

function updatePreset() {
  const preset = presets[presetSelect?.value] || presets.studio;
  const exposure = Number(exposureInput?.value || 1);
  if (scene) {
    if (lightGroup) scene.remove(lightGroup);
    lightGroup = new THREE.Group();
    scene.background = new THREE.Color(preset.background);
    const hemi = new THREE.HemisphereLight(...preset.hemi);
    lightGroup.add(hemi);
    preset.lights.forEach(([, color, intensity, position]) => {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position);
      lightGroup.add(light);
    });
    scene.add(lightGroup);
    renderer.toneMappingExposure = exposure;
  }
  if (code) code.textContent = buildLightingSnippet(preset, exposure);
}

function buildLightingSnippet(preset, exposure) {
  const lines = [
    `renderer.outputColorSpace = THREE.SRGBColorSpace;`,
    `renderer.toneMapping = THREE.ACESFilmicToneMapping;`,
    `renderer.toneMappingExposure = ${exposure};`,
    ``,
    `scene.background = new THREE.Color(0x${preset.background.toString(16).padStart(6, "0")});`,
    ``,
    `const hemi = new THREE.HemisphereLight(`,
    `  0x${preset.hemi[0].toString(16).padStart(6, "0")},`,
    `  0x${preset.hemi[1].toString(16).padStart(6, "0")},`,
    `  ${preset.hemi[2]}`,
    `);`,
    `scene.add(hemi);`,
    ``
  ];
  preset.lights.forEach(([name, color, intensity, position]) => {
    lines.push(`const ${name} = new THREE.DirectionalLight(0x${color.toString(16).padStart(6, "0")}, ${intensity});`);
    lines.push(`${name}.position.set(${position.join(", ")});`);
    lines.push(`scene.add(${name});`);
    lines.push(``);
  });
  return lines.join("\n");
}
