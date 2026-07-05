import { initSite } from "./shared/site.js";
import { THREE, createCamera, createRenderer, resizeRenderer, runScene } from "./shared/three-utils.js";

initSite();

document.querySelectorAll("canvas[data-example]").forEach((canvas) => {
  const name = canvas.dataset.example;
  if (name === "knot") createKnotExample(canvas);
  if (name === "particles") createParticleExample(canvas);
  if (name === "shader") createShaderExample(canvas);
});

function createKnotExample(canvas) {
  const container = canvas.parentElement;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f6fb);
  const camera = createCamera(container, [0, 0.35, 5.2]);
  camera.lookAt(0, 0, 0);
  const renderer = createRenderer(canvas, { exposure: 1.05 });
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223040, 2));
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 4, 4);
  scene.add(light);
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.78, 0.22, 140, 18),
    new THREE.MeshStandardMaterial({ color: 0x2f8f83, roughness: 0.36, metalness: 0.16 })
  );
  scene.add(mesh);
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    camera.lookAt(0, 0, 0);
    if (!reduced) {
      mesh.rotation.x = time * 0.00025;
      mesh.rotation.y = time * 0.00055;
    }
    renderer.render(scene, camera);
  });
}

function createParticleExample(canvas) {
  const container = canvas.parentElement;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f6fb);
  const camera = createCamera(container, [0, 0, 5]);
  camera.lookAt(0, 0, 0);
  const renderer = createRenderer(canvas, { exposure: 1 });
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 1.1 + Math.random() * 0.9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x2f8f83, size: 0.025, sizeAttenuation: true })
  );
  scene.add(points);
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    if (!reduced) points.rotation.y = time * 0.00012;
    renderer.render(scene, camera);
  });
}

function createShaderExample(canvas) {
  const container = canvas.parentElement;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f6fb);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
  camera.position.z = 3.4;
  camera.lookAt(0, 0, 0);
  const renderer = createRenderer(canvas, { exposure: 1 });
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "precision highp float; uniform float uTime; varying vec2 vUv; void main(){ float v = sin(vUv.x * 10.0 + uTime) * cos(vUv.y * 8.0 - uTime); vec3 a = vec3(0.18,0.56,0.51); vec3 b = vec3(0.08,0.11,0.16); gl_FragColor = vec4(mix(a,b,smoothstep(-0.6,0.7,v)),1.0); }"
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.1, 80, 80), material);
  scene.add(mesh);
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    material.uniforms.uTime.value = reduced ? 0 : time * 0.001;
    renderer.render(scene, camera);
  });
}
