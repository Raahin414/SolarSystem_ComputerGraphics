import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const POLYHAVEN_FILE_API = 'https://api.polyhaven.com/files';

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function pickNestedEntry(root, path) {
  let current = root;

  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return null;
    }

    current = current[key];
  }

  return isObject(current) && typeof current.url === 'string' ? current : null;
}

function pickEntry(root, candidates) {
  for (const path of candidates) {
    const entry = pickNestedEntry(root, path);

    if (entry) {
      return entry;
    }
  }

  return null;
}

async function loadAssetFiles(assetId) {
  const response = await fetch(`${POLYHAVEN_FILE_API}/${assetId}`);

  if (!response.ok) {
    throw new Error(`Poly Haven file lookup failed for ${assetId}: ${response.status}`);
  }

  return response.json();
}

export async function loadPolyHavenEnvironmentTexture(renderer, assetId = 'qwantani_night') {
  try {
    const files = await loadAssetFiles(assetId);
    const entry = pickEntry(files, [
      ['hdri', '4k', 'hdr'],
      ['hdri', '2k', 'hdr'],
      ['hdri', '1k', 'hdr'],
      ['hdri', '8k', 'hdr']
    ]);

    if (!entry) {
      throw new Error(`No usable HDRI found for ${assetId}`);
    }

    const texture = await new RGBELoader().loadAsync(entry.url);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const environmentTexture = pmremGenerator.fromEquirectangular(texture).texture;
    pmremGenerator.dispose();

    return {
      backgroundTexture: texture,
      environmentTexture
    };
  } catch (error) {
    console.warn(`Poly Haven environment fallback: ${error.message}`);
    return null;
  }
}