import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = process.cwd();

export default defineConfig({
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        gltfViewer: resolve(root, "gltf-viewer/index.html"),
        cameraFov: resolve(root, "camera-fov/index.html"),
        shaderStarter: resolve(root, "shader-starter/index.html"),
        lightingPresets: resolve(root, "lighting-presets/index.html"),
        examples: resolve(root, "examples/index.html"),
        threeJsParticles: resolve(root, "three-js-particles/index.html"),
        threeJsRotatingObject: resolve(root, "three-js-rotating-object/index.html"),
        threeJsShaderMaterialExample: resolve(root, "three-js-shader-material-example/index.html"),
        threeJsFitCameraToObject: resolve(root, "three-js-fit-camera-to-object/index.html"),
        threeJsGltfloaderExample: resolve(root, "three-js-gltfloader-example/index.html"),
        about: resolve(root, "about/index.html"),
        contact: resolve(root, "contact/index.html"),
        privacyPolicy: resolve(root, "privacy-policy/index.html"),
        termsOfUse: resolve(root, "terms-of-use/index.html"),
        cookiePolicy: resolve(root, "cookie-policy/index.html")
      }
    }
  }
});
