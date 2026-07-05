import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export { THREE, OrbitControls };

export function createRenderer(canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: options.alpha ?? false,
    preserveDrawingBuffer: options.preserveDrawingBuffer ?? false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.exposure ?? 1;
  return renderer;
}

export function resizeRenderer(renderer, camera, container) {
  const target = container || renderer.domElement.parentElement || document.body;
  const width = Math.max(1, target.clientWidth);
  const height = Math.max(1, target.clientHeight);
  const size = renderer.getSize(new THREE.Vector2());
  if (size.x !== width || size.y !== height) {
    renderer.setSize(width, height, false);
    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
}

export function createCamera(container, position = [3, 2.2, 4.2]) {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
  camera.position.set(...position);
  return camera;
}

export function createOrbit(camera, canvas, target = [0, 0.5, 0]) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(...target);
  controls.update();
  return controls;
}

export function addStudioLighting(scene) {
  scene.add(new THREE.HemisphereLight(0xf3f7ff, 0x202733, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x89fff0, 1.1);
  rim.position.set(-4, 2.5, -3);
  scene.add(rim);
}

export function addGrid(scene, size = 8) {
  const grid = new THREE.GridHelper(size, size, 0x8aa0b8, 0xd2dae8);
  grid.position.y = -0.01;
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  scene.add(grid);
  return grid;
}

export function fitCameraToObject(camera, object, controls, offset = 1.45) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 0.01);
  const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);
  const direction = new THREE.Vector3()
    .subVectors(camera.position, controls?.target || new THREE.Vector3())
    .normalize()
    .multiplyScalar(distance);
  camera.position.copy(center).add(direction);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
}

export function createSampleModel() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x2f8f83,
    roughness: 0.42,
    metalness: 0.18
  });
  const wire = new THREE.MeshBasicMaterial({
    color: 0x12323a,
    wireframe: true,
    transparent: true,
    opacity: 0.24
  });

  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.74, 0.22, 120, 16), material);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 1), wire);
  group.add(knot, shell);
  return group;
}

export function runScene(renderFrame) {
  let frameId = 0;
  let active = true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tick(time) {
    if (!active) return;
    renderFrame(time, reduced);
    frameId = window.requestAnimationFrame(tick);
  }

  frameId = window.requestAnimationFrame(tick);
  return () => {
    active = false;
    window.cancelAnimationFrame(frameId);
  };
}
