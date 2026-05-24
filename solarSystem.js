import { loadPolyHavenEnvironmentTexture } from './utils/polyhavenAssets.js';
import { createSceneRuntime } from './scene/createSceneRuntime.js';
import { createSolarSystem, createStarfield } from './scene/buildSolarSystem.js';
import { startSolarSystemAnimation } from './scene/animateSolarSystem.js';

const ui = {
  hdriStatus: document.getElementById('hdriStatus'),
  objectStatus: document.getElementById('objectStatus'),
  renderStatus: document.getElementById('renderStatus')
};

const { app, controls, composer } = createSceneRuntime();

const materials = {};
const planetSystems = [];

function setChip(chip, label, active = true) {
  if (!chip) return;
  chip.classList.toggle('off', !active);
  const textNode = chip.childNodes[chip.childNodes.length - 1];
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    textNode.textContent = ` ${label}`;
  }
}

async function hydrateEnvironment() {
  setChip(ui.hdriStatus, 'HDRI loading...', true);

  const environment = await loadPolyHavenEnvironmentTexture(app.renderer, 'qwantani_night');

  if (environment) {
    app.scene.environment = environment.environmentTexture;
    setChip(ui.hdriStatus, 'HDRI active', true);
  } else {
    setChip(ui.hdriStatus, 'HDRI fallback', false);
  }
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  app.camera.aspect = width / height;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(width, height);
  composer.setSize(width, height);
}

const starfield = createStarfield();
app.scene.add(starfield.points);

const system = createSolarSystem(app.scene, planetSystems, materials);
setChip(ui.objectStatus, `${planetSystems.length} planets + moon + debris`, true);
setChip(ui.renderStatus, 'Bloom + Fog + Tone', true);

window.addEventListener('resize', resize);
void hydrateEnvironment();
startSolarSystemAnimation({ app, controls, composer, system, starfield, planetSystems });
