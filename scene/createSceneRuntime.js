import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createSceneRuntime() {
  const app = {
    scene: new THREE.Scene(),
    clock: new THREE.Clock(),
    camera: new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 320),
    renderer: new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  };

  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  app.renderer.toneMappingExposure = 1.02;
  app.renderer.shadowMap.enabled = true;
  app.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(app.renderer.domElement);

  app.scene.background = new THREE.Color(0x02040a);
  app.scene.fog = new THREE.FogExp2(0x070b17, 0.0061);

  app.camera.position.set(0, 9.5, 28);

  const controls = new OrbitControls(app.camera, app.renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 10;
  controls.maxDistance = 85;
  controls.target.set(0, 0, 0);

  const composer = new EffectComposer(app.renderer);
  composer.addPass(new RenderPass(app.scene, app.camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.78, 0.28, 0.9);
  composer.addPass(bloomPass);

  return { app, controls, composer, bloomPass };
}
