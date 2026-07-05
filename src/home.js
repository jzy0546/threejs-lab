import { initSite } from "./shared/site.js";
import {
  THREE,
  addGrid,
  addStudioLighting,
  createCamera,
  createOrbit,
  createRenderer,
  createSampleModel,
  resizeRenderer,
  runScene
} from "./shared/three-utils.js";

initSite();

const canvas = document.querySelector("#hero-canvas");
if (canvas) {
  const container = canvas.parentElement;
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = createCamera(container, [3.2, 2.2, 4.4]);
  const renderer = createRenderer(canvas, { alpha: true, exposure: 1.05 });
  const controls = createOrbit(camera, canvas, [0, 0.45, 0]);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;

  addStudioLighting(scene);
  addGrid(scene, 8);
  const model = createSampleModel();
  model.position.y = 0.8;
  scene.add(model);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.012, 16, 160),
    new THREE.MeshBasicMaterial({ color: 0x2f8f83, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  scene.add(ring);

  window.addEventListener("resize", () => resizeRenderer(renderer, camera, container));
  runScene((time, reduced) => {
    resizeRenderer(renderer, camera, container);
    if (!reduced) {
      model.rotation.y = time * 0.00032;
      ring.rotation.z = time * 0.00018;
      controls.update();
    }
    renderer.render(scene, camera);
  });
}
