import * as THREE from 'three';
import sunGlowVertexShader from '../shaders/sunGlow.vert.glsl?raw';
import sunGlowFragmentShader from '../shaders/sunGlow.frag.glsl?raw';

function makePlanetTexture(config) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const base = ctx.createRadialGradient(size * 0.28, size * 0.22, size * 24 / 512, size * 0.56, size * 0.56, size * 0.6);
  base.addColorStop(0, config.baseLight);
  base.addColorStop(0.55, config.baseMid);
  base.addColorStop(1, config.baseDark);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < config.bands; i += 1) {
    const y = (i / config.bands) * size;
    const waveA = Math.sin(i * 0.46) * (8 + config.seed * 2.2);
    const waveB = Math.cos(i * 0.19 + config.seed * 1.9) * 5;
    ctx.strokeStyle = `rgba(${config.bandColor.r}, ${config.bandColor.g}, ${config.bandColor.b}, ${0.08 + (i % 4) * 0.018})`;
    ctx.lineWidth = 8 + (i % 7);
    ctx.beginPath();
    ctx.moveTo(0, y + waveA);
    for (let x = 0; x <= size; x += 24) {
      const warp = Math.sin((x / size) * Math.PI * (3 + config.seed) + i * 0.33) * (4 + config.seed);
      ctx.lineTo(x, y + waveA + waveB + warp);
    }
    ctx.stroke();
  }

  for (let i = 0; i < config.spots; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 8 + Math.random() * config.spotRadius;
    const spot = ctx.createRadialGradient(x, y, 0, x, y, radius);
    spot.addColorStop(0, `rgba(${config.spotColor.r}, ${config.spotColor.g}, ${config.spotColor.b}, 0.35)`);
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

function createOrbitRing(scene, radius) {
  const segments = 180;
  const positions = new Float32Array((segments + 1) * 3);

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    positions[i * 3 + 0] = Math.cos(t) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(t) * radius;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x8ca0c2, transparent: true, opacity: 0.2 });
  const ring = new THREE.Line(geometry, material);
  ring.rotation.x = Math.PI * 0.5;
  scene.add(ring);
}

function createSun(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(2.35, 72, 48),
    new THREE.MeshStandardMaterial({
      color: 0xffc768,
      emissive: 0xff9f2f,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.04
    })
  );
  sunCore.castShadow = false;
  sunCore.receiveShadow = false;
  group.add(sunCore);

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.1, 64, 40),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowColor: { value: new THREE.Color(0xffb24f) },
        uRimColor: { value: new THREE.Color(0xffecbe) },
        uIntensity: { value: 0.86 },
        uPulseSpeed: { value: 1.35 }
      },
      vertexShader: sunGlowVertexShader,
      fragmentShader: sunGlowFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide
    })
  );
  group.add(sunGlow);

  const light = new THREE.PointLight(0xffc068, 190, 250, 2.2);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.00015;
  light.shadow.normalBias = 0.02;
  group.add(light);

  return { group, sunCore, sunGlow, light };
}

function createDebrisField(scene) {
  const debrisGroup = new THREE.Group();
  scene.add(debrisGroup);

  const debrisMaterial = new THREE.MeshStandardMaterial({
    color: 0x7e8593,
    roughness: 0.88,
    metalness: 0.08,
    envMapIntensity: 0.35
  });

  const clusterCenters = [
    new THREE.Vector3(-8.2, 2.6, 8.5),
    new THREE.Vector3(7.4, -1.1, -6.2),
    new THREE.Vector3(13.5, 3.3, 4.6)
  ];

  const debrisPieces = [];

  clusterCenters.forEach((center, clusterIndex) => {
    for (let i = 0; i < 8; i += 1) {
      const radius = 0.12 + Math.random() * 0.26;
      const detail = i % 2;
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), debrisMaterial);

      mesh.position.set(
        center.x + THREE.MathUtils.randFloatSpread(2.7),
        center.y + THREE.MathUtils.randFloatSpread(1.6),
        center.z + THREE.MathUtils.randFloatSpread(2.7)
      );

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.castShadow = false;
      mesh.receiveShadow = true;

      debrisGroup.add(mesh);
      debrisPieces.push({
        mesh,
        speed: 0.08 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        drift: 0.04 + clusterIndex * 0.012
      });
    }
  });

  return { debrisGroup, debrisPieces };
}

function createPlanetSystem(scene, planetSystems, config) {
  const pivot = new THREE.Object3D();
  pivot.matrixAutoUpdate = false;
  scene.add(pivot);

  const material = new THREE.MeshStandardMaterial({
    map: makePlanetTexture(config.texture),
    roughness: config.roughness,
    metalness: config.metalness,
    envMapIntensity: 1.0
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(config.radius, 56, 36), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.matrixAutoUpdate = false;
  pivot.add(mesh);

  createOrbitRing(scene, config.orbitRadius);

  const system = {
    config,
    pivot,
    mesh,
    moon: null
  };

  if (config.moon) {
    const moonPivot = new THREE.Object3D();
    moonPivot.matrixAutoUpdate = false;
    mesh.add(moonPivot);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(config.moon.radius, 38, 24),
      new THREE.MeshStandardMaterial({
        map: makePlanetTexture(config.moon.texture),
        roughness: 0.86,
        metalness: 0.05,
        envMapIntensity: 0.4
      })
    );

    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    moonMesh.matrixAutoUpdate = false;
    moonPivot.add(moonMesh);

    system.moon = {
      pivot: moonPivot,
      mesh: moonMesh,
      orbitRadius: config.moon.orbitRadius,
      orbitSpeed: config.moon.orbitSpeed,
      spinSpeed: config.moon.spinSpeed
    };
  }

  planetSystems.push(system);
}

export function createStarfield() {
  const count = 2800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const radius = THREE.MathUtils.randFloat(85, 180);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    color.setHSL(0.56 + Math.random() * 0.12, 0.35, 0.74 + Math.random() * 0.22);
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.35,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  return {
    points: new THREE.Points(geometry, material),
    material
  };
}

export function createSolarSystem(scene, planetSystems, materials) {
  const sun = createSun(scene);

  const ambient = new THREE.AmbientLight(0xa2b7ff, 0.18);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0x87a8ff, 0.24);
  fill.position.set(-18, 12, -20);
  scene.add(fill);

  const planets = [
    {
      name: 'Aurelia',
      radius: 0.9,
      orbitRadius: 6,
      orbitSpeed: 0.36,
      spinSpeed: 1.4,
      orbitTilt: 0.03,
      roughness: 0.7,
      metalness: 0.05,
      texture: {
        seed: 1.1,
        baseLight: '#9f7f4f',
        baseMid: '#705239',
        baseDark: '#3f2d22',
        bands: 32,
        spots: 80,
        spotRadius: 24,
        bandColor: { r: 165, g: 124, b: 92 },
        spotColor: { r: 68, g: 43, b: 27 }
      }
    },
    {
      name: 'Cyanis',
      radius: 1.45,
      orbitRadius: 10.5,
      orbitSpeed: 0.24,
      spinSpeed: 0.95,
      orbitTilt: -0.08,
      roughness: 0.52,
      metalness: 0.09,
      texture: {
        seed: 2.2,
        baseLight: '#73a8c9',
        baseMid: '#447794',
        baseDark: '#1e455f',
        bands: 40,
        spots: 120,
        spotRadius: 18,
        bandColor: { r: 131, g: 189, b: 216 },
        spotColor: { r: 38, g: 68, b: 86 }
      },
      moon: {
        radius: 0.36,
        orbitRadius: 2.2,
        orbitSpeed: 1.65,
        spinSpeed: 1.2,
        texture: {
          seed: 4.3,
          baseLight: '#b8b5b0',
          baseMid: '#8f8a81',
          baseDark: '#5f5952',
          bands: 26,
          spots: 60,
          spotRadius: 14,
          bandColor: { r: 195, g: 186, b: 173 },
          spotColor: { r: 78, g: 72, b: 66 }
        }
      }
    },
    {
      name: 'Virdis',
      radius: 1.1,
      orbitRadius: 15.2,
      orbitSpeed: 0.16,
      spinSpeed: 1.05,
      orbitTilt: 0.12,
      roughness: 0.61,
      metalness: 0.07,
      texture: {
        seed: 3.4,
        baseLight: '#8eb36f',
        baseMid: '#4d7d48',
        baseDark: '#234a31',
        bands: 36,
        spots: 95,
        spotRadius: 20,
        bandColor: { r: 158, g: 190, b: 123 },
        spotColor: { r: 35, g: 66, b: 40 }
      }
    },
    {
      name: 'Noctra',
      radius: 1.72,
      orbitRadius: 21,
      orbitSpeed: 0.11,
      spinSpeed: 0.72,
      orbitTilt: -0.05,
      roughness: 0.42,
      metalness: 0.12,
      texture: {
        seed: 5.1,
        baseLight: '#7f86b7',
        baseMid: '#4f5c8f',
        baseDark: '#2a315a',
        bands: 42,
        spots: 145,
        spotRadius: 28,
        bandColor: { r: 156, g: 168, b: 228 },
        spotColor: { r: 43, g: 51, b: 102 }
      }
    }
  ];

  planets.forEach((planet) => createPlanetSystem(scene, planetSystems, planet));

  materials.metal = new THREE.MeshStandardMaterial({
    color: 0xc1ccd9,
    metalness: 0.84,
    roughness: 0.24,
    envMapIntensity: 1.18
  });

  const reflective = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.34, 150, 24), materials.metal);
  reflective.position.set(-6.4, 1.8, 6.8);
  reflective.castShadow = true;
  reflective.receiveShadow = true;
  scene.add(reflective);

  const debris = createDebrisField(scene);

  return { sun, reflective, ambient, fill, debris };
}
