import { mat4, vec3 } from '../lib/gl-matrix.js';

function sphere(radius = 1, lat = 24, lon = 36) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= lat; y += 1) {
    const v = y / lat;
    const phi = v * Math.PI;
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);

    for (let x = 0; x <= lon; x += 1) {
      const u = x / lon;
      const th = u * Math.PI * 2;
      const st = Math.sin(th);
      const ct = Math.cos(th);
      const nx = ct * sp;
      const ny = cp;
      const nz = st * sp;

      positions.push(nx * radius, ny * radius, nz * radius);
      normals.push(nx, ny, nz);
      uvs.push(u, 1 - v);
    }
  }

  for (let y = 0; y < lat; y += 1) {
    for (let x = 0; x < lon; x += 1) {
      const a = y * (lon + 1) + x;
      const b = a + lon + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, normals, uvs, indices };
}

function cube(size = 1) {
  const s = size * 0.5;
  const positions = [
    -s, -s, s, s, -s, s, s, s, s, -s, s, s,
    s, -s, -s, -s, -s, -s, -s, s, -s, s, s, -s,
    -s, s, s, s, s, s, s, s, -s, -s, s, -s,
    -s, -s, -s, s, -s, -s, s, -s, s, -s, -s, s,
    s, -s, s, s, -s, -s, s, s, -s, s, s, s,
    -s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s
  ];
  const normals = Array(positions.length).fill(0);
  const uvs = Array((positions.length / 3) * 2).fill(0);
  const indices = [];
  for (let i = 0; i < 6; i += 1) {
    const o = i * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  return { positions, normals, uvs, indices };
}

function obj(mesh, material) {
  return { mesh, material, model: mat4.create() };
}

function r(min, max) {
  return min + Math.random() * (max - min);
}

export async function createSceneState(createMesh) {
  const planetMesh = createMesh(sphere(1, 24, 36));
  const sunMesh = createMesh(sphere(1, 32, 48));
  const asteroidMesh = createMesh(sphere(1, 10, 14));
  const skyboxMesh = createMesh(cube(1));

  const sun = obj(sunMesh, { type: 'sun', texturePath: './assets/textures/planets/sun_2k.jpg' });
  const earth = obj(planetMesh, {
    type: 'lit',
    color: [0.34, 0.57, 0.78],
    dayTexturePath: './assets/textures/planets/earth_day_2k.jpg',
    nightTexturePath: './assets/textures/planets/earth_night_2k.jpg',
    shininess: 96,
    specStrength: 0.78,
    nightStrength: 1.2,
    alpha: 1
  });
  const mars = obj(planetMesh, {
    type: 'lit',
    color: [0.72, 0.43, 0.31],
    dayTexturePath: './assets/textures/planets/mars_2k.jpg',
    shininess: 28,
    specStrength: 0.2,
    nightStrength: 0,
    alpha: 1
  });
  const moon = obj(planetMesh, {
    type: 'lit',
    color: [0.74, 0.74, 0.76],
    dayTexturePath: './assets/textures/planets/moon_2k.jpg',
    shininess: 22,
    specStrength: 0.14,
    nightStrength: 0,
    alpha: 1
  });

  const asteroids = Array.from({ length: 12 }).map(() => ({
    base: vec3.fromValues(r(-18, 18), r(-4, 4), r(-18, 18)),
    drift: r(0.05, 0.15),
    phase: r(0, Math.PI * 2),
    spin: r(0.2, 0.7),
    scale: r(0.08, 0.2),
    object: obj(asteroidMesh, {
      type: 'lit',
      color: [0.45 + Math.random() * 0.15, 0.4 + Math.random() * 0.14, 0.35 + Math.random() * 0.16],
      shininess: 8,
      specStrength: 0.06,
      nightStrength: 0,
      alpha: 1
    })
  }));

  const skybox = obj(skyboxMesh, { type: 'skybox' });

  return {
    sun,
    earth,
    mars,
    moon,
    asteroids,
    skybox,
    lightPosition: vec3.fromValues(0, 0, 0),
    pointLightPosition: vec3.fromValues(0, 0, 0),
    orbits: {
      earthRadius: 6,
      marsRadius: 10.2,
      moonRadius: 2.3,
      earthOrbit: 0.37,
      marsOrbit: 0.25,
      moonOrbit: 1.55,
      earthSpin: 1.16,
      marsSpin: 0.76,
      moonSpin: 1.2
    }
  };
}

export function updateSceneState(state, time) {
  const { orbits } = state;

  mat4.identity(state.sun.model);
  const sunScale = 2.2 + Math.sin(time * 1.4) * 0.04;
  mat4.scale(state.sun.model, state.sun.model, vec3.fromValues(sunScale, sunScale, sunScale));

  mat4.identity(state.earth.model);
  mat4.rotateY(state.earth.model, state.earth.model, time * orbits.earthOrbit);
  mat4.translate(state.earth.model, state.earth.model, vec3.fromValues(orbits.earthRadius, 0, 0));
  mat4.rotateY(state.earth.model, state.earth.model, time * orbits.earthSpin);
  mat4.scale(state.earth.model, state.earth.model, vec3.fromValues(1.06, 1.06, 1.06));

  mat4.identity(state.mars.model);
  mat4.rotateY(state.mars.model, state.mars.model, time * orbits.marsOrbit + 0.65);
  mat4.translate(state.mars.model, state.mars.model, vec3.fromValues(orbits.marsRadius, 0, 0));
  mat4.rotateY(state.mars.model, state.mars.model, time * orbits.marsSpin);
  mat4.scale(state.mars.model, state.mars.model, vec3.fromValues(1.32, 1.32, 1.32));

  // Secondary point light orbits around Mars to satisfy multi-light setup.
  state.pointLightPosition[0] = state.mars.model[12] + Math.cos(time * 1.4) * 1.8;
  state.pointLightPosition[1] = state.mars.model[13] + 0.65 + Math.sin(time * 1.1) * 0.35;
  state.pointLightPosition[2] = state.mars.model[14] + Math.sin(time * 1.4) * 1.8;

  mat4.copy(state.moon.model, state.earth.model);
  mat4.rotateY(state.moon.model, state.moon.model, time * orbits.moonOrbit);
  mat4.translate(state.moon.model, state.moon.model, vec3.fromValues(orbits.moonRadius, 0.1, 0));
  mat4.rotateY(state.moon.model, state.moon.model, time * orbits.moonSpin);
  mat4.scale(state.moon.model, state.moon.model, vec3.fromValues(0.42, 0.42, 0.42));

  for (const asteroid of state.asteroids) {
    const w = Math.sin(time * asteroid.drift + asteroid.phase) * 0.9;
    mat4.identity(asteroid.object.model);
    mat4.translate(
      asteroid.object.model,
      asteroid.object.model,
      vec3.fromValues(
        asteroid.base[0] + w,
        asteroid.base[1] + Math.cos(time * asteroid.drift * 1.3) * 0.2,
        asteroid.base[2] - w * 0.7
      )
    );
    mat4.rotateY(asteroid.object.model, asteroid.object.model, time * asteroid.spin);
    mat4.rotateX(asteroid.object.model, asteroid.object.model, time * asteroid.spin * 0.6);
    mat4.scale(asteroid.object.model, asteroid.object.model, vec3.fromValues(asteroid.scale, asteroid.scale, asteroid.scale));
  }

  mat4.identity(state.skybox.model);
  mat4.scale(state.skybox.model, state.skybox.model, vec3.fromValues(300, 300, 300));
}

export function getLitObjects(state) {
  return [
    state.earth,
    state.mars,
    state.moon,
    ...state.asteroids.map((a) => a.object)
  ];
}
