import { initSite } from "./shared/site.js";
import { THREE, createRenderer, resizeRenderer, runScene } from "./shared/three-utils.js";

initSite();

const canvas = document.querySelector("#shader-canvas");
const inputs = {
  colorA: document.querySelector("#color-a"),
  colorB: document.querySelector("#color-b"),
  speed: document.querySelector("#shader-speed"),
  pattern: document.querySelector("#shader-pattern")
};
const code = document.querySelector("#shader-code");

let scene;
let camera;
let renderer;
let mesh;
let material;

if (canvas) {
  const container = canvas.parentElement;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f6fb);
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0, 3.8);
  renderer = createRenderer(canvas, { exposure: 1 });
  mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2, 120, 80), null);
  scene.add(mesh);
  window.addEventListener("resize", () => resizeRenderer(renderer, camera, container));
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    if (material) {
      material.uniforms.uTime.value = reduced ? 0 : time * 0.001 * Number(inputs.speed.value);
    }
    renderer.render(scene, camera);
  });
}

Object.values(inputs).forEach((input) => input?.addEventListener("input", updateShader));
updateShader();

function updateShader() {
  const colorA = inputs.colorA.value;
  const colorB = inputs.colorB.value;
  const speed = Number(inputs.speed.value || 1);
  const pattern = inputs.pattern.value;
  const fragmentShader = getFragmentShader(pattern);

  if (mesh) {
    material?.dispose();
    material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) }
      },
      vertexShader: getVertexShader(),
      fragmentShader
    });
    mesh.material = material;
  }

  if (code) code.textContent = buildSnippet(colorA, colorB, speed, pattern, fragmentShader);
}

function getVertexShader() {
  return `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
}

function getFragmentShader(pattern) {
  const body = {
    wave: `float bands = sin((vUv.x * 8.0) + (uTime * 1.8));
float mixValue = smoothstep(-0.6, 0.8, bands);`,
    radial: `vec2 centeredUv = vUv - 0.5;
float radius = length(centeredUv);
float mixValue = smoothstep(0.55, 0.05, radius + sin(uTime) * 0.05);`,
    grid: `vec2 cells = abs(fract(vUv * 9.0) - 0.5);
float line = step(0.46, max(cells.x, cells.y));
float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
float mixValue = max(line, pulse * 0.22);`
  }[pattern];

  return `precision highp float;

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main() {
  ${body}
  vec3 color = mix(uColorA, uColorB, mixValue);
  gl_FragColor = vec4(color, 1.0);
}`;
}

function buildSnippet(colorA, colorB, speed, pattern, fragmentShader) {
  return `const uniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color("${colorA}") },
  uColorB: { value: new THREE.Color("${colorB}") }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: \`${getVertexShader()}\`,
  fragmentShader: \`${fragmentShader}\`
});

function animate(time) {
  uniforms.uTime.value = time * 0.001 * ${speed};
  renderer.render(scene, camera);
}

// Pattern: ${pattern}`;
}
