import { createRenderer, resizeRenderer, createProgram, createMesh, drawMesh } from './renderer.js';
import { OrbitCamera } from './camera.js';
import { loadShaderSources } from './shaders.js';
import { loadTexture2D, loadCubemap } from './textureLoader.js';
import { createSceneState, updateSceneState, getLitObjects } from './scene.js';

const canvas = document.getElementById('glCanvas');
const statusEl = document.getElementById('status');

const BLOOM_THRESHOLD = 0.94;
const BLOOM_STRENGTH = 0.22;
const BLOOM_PASSES = 2;
const BLOOM_BLUR_SCALE = 0.72;

function createSceneTarget(gl, width, height) {
  const color = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const depth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Scene framebuffer incomplete');
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, color, depth, width, height };
}

function createPostTarget(gl, width, height) {
  const color = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Post framebuffer incomplete');
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, color, width, height };
}

function deleteTarget(gl, target) {
  if (!target) return;
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.color);
  if (target.depth) gl.deleteRenderbuffer(target.depth);
}

function createFullscreenQuad(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertices = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  return { vao, vbo };
}

function drawFullscreenQuad(gl, quad) {
  gl.bindVertexArray(quad.vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
}

async function init() {
  const renderer = createRenderer(canvas);
  const { gl } = renderer;
  const camera = new OrbitCamera(canvas);
  camera.target[0] = 0;
  camera.target[1] = 0;
  camera.target[2] = 0;
  camera.distance = 10;
  camera.yaw = 0;
  camera.pitch = 0;

  statusEl.textContent = 'Loading shaders...';
  const shaderSources = await loadShaderSources();

  const skyVS = `#version 300 es
layout(location=0) in vec3 aPosition;
out vec3 vDir;
uniform mat4 uView;
uniform mat4 uProjection;
void main(){
  vDir = aPosition;
  mat4 v = uView;
  v[3] = vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position = uProjection * v * vec4(aPosition * 300.0, 1.0);
}`;

  const skyFS = `#version 300 es
precision highp float;
in vec3 vDir;
uniform samplerCube uEnvMap;
out vec4 fragColor;
void main(){ fragColor = vec4(texture(uEnvMap, normalize(vDir)).rgb, 1.0); }`;

  const postVS = `#version 300 es
layout(location=0) in vec2 aPosition;
out vec2 vUV;
void main(){
  vUV = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

  const extractFS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene;
uniform float uThreshold;
out vec4 fragColor;
void main(){
  vec3 c = texture(uScene, vUV).rgb;
  float l = max(c.r, max(c.g, c.b));
  fragColor = vec4(l > uThreshold ? c : vec3(0.0), 1.0);
}`;

  const blurFS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uImage;
uniform vec2 uTexel;
uniform vec2 uDirection;
out vec4 fragColor;
void main(){
  vec3 r = texture(uImage, vUV).rgb * 0.227027;
  r += texture(uImage, vUV + uDirection * uTexel * 1.384615).rgb * 0.316216;
  r += texture(uImage, vUV - uDirection * uTexel * 1.384615).rgb * 0.316216;
  r += texture(uImage, vUV + uDirection * uTexel * 3.230769).rgb * 0.070270;
  r += texture(uImage, vUV - uDirection * uTexel * 3.230769).rgb * 0.070270;
  fragColor = vec4(r, 1.0);
}`;

  const compositeFS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uStrength;
out vec4 fragColor;
void main(){
  vec3 sceneCol = texture(uScene, vUV).rgb;
  vec3 bloomCol = texture(uBloom, vUV).rgb;
  fragColor = vec4(sceneCol + bloomCol * uStrength, 1.0);
}`;

  const programs = {
    standard: createProgram(gl, shaderSources.standard.vertex, shaderSources.standard.fragment),
    sun: createProgram(gl, shaderSources.sun.vertex, shaderSources.sun.fragment),
    skybox: createProgram(gl, skyVS, skyFS),
    extract: createProgram(gl, postVS, extractFS),
    blur: createProgram(gl, postVS, blurFS),
    composite: createProgram(gl, postVS, compositeFS)
  };

  statusEl.textContent = 'Building scene...';
  const scene = await createSceneState((geometry) => createMesh(gl, geometry));

  const textureCache = new Map();
  async function getTexture(path, fallback) {
    if (!path) return null;
    if (!textureCache.has(path)) textureCache.set(path, await loadTexture2D(gl, path, fallback));
    return textureCache.get(path);
  }

  statusEl.textContent = 'Loading textures...';
  const litObjects = getLitObjects(scene);
  await Promise.all(litObjects.map(async (obj) => {
    const [dayTexture, nightTexture, specTexture] = await Promise.all([
      getTexture(obj.material.dayTexturePath, [180, 170, 160, 255]),
      getTexture(obj.material.nightTexturePath, [6, 6, 12, 255]),
      getTexture(obj.material.specTexturePath, [255, 255, 255, 255])
    ]);
    obj.material.dayTexture = dayTexture;
    obj.material.nightTexture = nightTexture;
    obj.material.specTexture = specTexture;
  }));

  scene.sun.material.sunTexture = await getTexture(scene.sun.material.texturePath, [255, 180, 80, 255]);
  scene.environmentMap = await loadCubemap(gl, [
    './assets/hdr/cubemap/px.jpg',
    './assets/hdr/cubemap/nx.jpg',
    './assets/hdr/cubemap/py.jpg',
    './assets/hdr/cubemap/ny.jpg',
    './assets/hdr/cubemap/pz.jpg',
    './assets/hdr/cubemap/nz.jpg'
  ]);

  const uniforms = {
    standard: {
      uModel: gl.getUniformLocation(programs.standard, 'uModel'),
      uView: gl.getUniformLocation(programs.standard, 'uView'),
      uProjection: gl.getUniformLocation(programs.standard, 'uProjection'),
      uCameraPos: gl.getUniformLocation(programs.standard, 'uCameraPos'),
      uLightPos: gl.getUniformLocation(programs.standard, 'uLightPos'),
      uPointLightPos: gl.getUniformLocation(programs.standard, 'uPointLightPos'),
      uPointLightColor: gl.getUniformLocation(programs.standard, 'uPointLightColor'),
      uPointLightIntensity: gl.getUniformLocation(programs.standard, 'uPointLightIntensity'),
      uPointLightRange: gl.getUniformLocation(programs.standard, 'uPointLightRange'),
      uAmbientFill: gl.getUniformLocation(programs.standard, 'uAmbientFill'),
      uAlbedo: gl.getUniformLocation(programs.standard, 'uAlbedo'),
      uDayTexture: gl.getUniformLocation(programs.standard, 'uDayTexture'),
      uNightTexture: gl.getUniformLocation(programs.standard, 'uNightTexture'),
      uSpecTexture: gl.getUniformLocation(programs.standard, 'uSpecTexture'),
      uUseDayTexture: gl.getUniformLocation(programs.standard, 'uUseDayTexture'),
      uUseNightTexture: gl.getUniformLocation(programs.standard, 'uUseNightTexture'),
      uUseSpecTexture: gl.getUniformLocation(programs.standard, 'uUseSpecTexture'),
      uNightStrength: gl.getUniformLocation(programs.standard, 'uNightStrength'),
      uSpecStrength: gl.getUniformLocation(programs.standard, 'uSpecStrength'),
      uShininess: gl.getUniformLocation(programs.standard, 'uShininess'),
      uAlpha: gl.getUniformLocation(programs.standard, 'uAlpha')
    },
    sun: {
      uModel: gl.getUniformLocation(programs.sun, 'uModel'),
      uView: gl.getUniformLocation(programs.sun, 'uView'),
      uProjection: gl.getUniformLocation(programs.sun, 'uProjection'),
      uTime: gl.getUniformLocation(programs.sun, 'uTime'),
      uSunTexture: gl.getUniformLocation(programs.sun, 'uSunTexture')
    },
    skybox: {
      uView: gl.getUniformLocation(programs.skybox, 'uView'),
      uProjection: gl.getUniformLocation(programs.skybox, 'uProjection'),
      uEnvMap: gl.getUniformLocation(programs.skybox, 'uEnvMap')
    },
    extract: {
      uScene: gl.getUniformLocation(programs.extract, 'uScene'),
      uThreshold: gl.getUniformLocation(programs.extract, 'uThreshold')
    },
    blur: {
      uImage: gl.getUniformLocation(programs.blur, 'uImage'),
      uTexel: gl.getUniformLocation(programs.blur, 'uTexel'),
      uDirection: gl.getUniformLocation(programs.blur, 'uDirection')
    },
    composite: {
      uScene: gl.getUniformLocation(programs.composite, 'uScene'),
      uBloom: gl.getUniformLocation(programs.composite, 'uBloom'),
      uStrength: gl.getUniformLocation(programs.composite, 'uStrength')
    }
  };

  const quad = createFullscreenQuad(gl);
  let sceneTarget = null;
  let bloomA = null;
  let bloomB = null;

  function ensureTargets(width, height) {
    if (sceneTarget && sceneTarget.width === width && sceneTarget.height === height) return;
    deleteTarget(gl, sceneTarget);
    deleteTarget(gl, bloomA);
    deleteTarget(gl, bloomB);
    sceneTarget = createSceneTarget(gl, width, height);
    bloomA = createPostTarget(gl, width, height);
    bloomB = createPostTarget(gl, width, height);
  }

  statusEl.textContent = 'Running pure WebGL engine';
  const start = performance.now();

  function render() {
    const time = (performance.now() - start) * 0.001;
    const size = resizeRenderer(renderer);
    ensureTargets(size.width, size.height);
    camera.update(size.width, size.height);
    updateSceneState(scene, time);

    gl.enable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget.fbo);
    gl.viewport(0, 0, size.width, size.height);
    gl.clearColor(0.022, 0.032, 0.058, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.useProgram(programs.skybox);
    gl.uniformMatrix4fv(uniforms.skybox.uView, false, camera.view);
    gl.uniformMatrix4fv(uniforms.skybox.uProjection, false, camera.projection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, scene.environmentMap);
    gl.uniform1i(uniforms.skybox.uEnvMap, 0);
    drawMesh(gl, scene.skybox.mesh);

    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.useProgram(programs.sun);
    gl.uniformMatrix4fv(uniforms.sun.uModel, false, scene.sun.model);
    gl.uniformMatrix4fv(uniforms.sun.uView, false, camera.view);
    gl.uniformMatrix4fv(uniforms.sun.uProjection, false, camera.projection);
    gl.uniform1f(uniforms.sun.uTime, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.sun.material.sunTexture);
    gl.uniform1i(uniforms.sun.uSunTexture, 0);
    drawMesh(gl, scene.sun.mesh);

    gl.useProgram(programs.standard);
    gl.uniformMatrix4fv(uniforms.standard.uView, false, camera.view);
    gl.uniformMatrix4fv(uniforms.standard.uProjection, false, camera.projection);
    gl.uniform3fv(uniforms.standard.uCameraPos, camera.eye);
    gl.uniform3fv(uniforms.standard.uLightPos, scene.lightPosition);
    gl.uniform3fv(uniforms.standard.uPointLightPos, scene.pointLightPosition);
    gl.uniform3fv(uniforms.standard.uPointLightColor, new Float32Array([0.18, 0.26, 0.48]));
    gl.uniform1f(uniforms.standard.uPointLightIntensity, 0.54);
    gl.uniform1f(uniforms.standard.uPointLightRange, 3.6);
    gl.uniform1f(uniforms.standard.uAmbientFill, 0.065);

    for (const object of litObjects) {
      gl.uniformMatrix4fv(uniforms.standard.uModel, false, object.model);
      gl.uniform3fv(uniforms.standard.uAlbedo, object.material.color);
      gl.uniform1f(uniforms.standard.uNightStrength, object.material.nightStrength ?? 0);
      gl.uniform1f(uniforms.standard.uSpecStrength, object.material.specStrength ?? 0.4);
      gl.uniform1f(uniforms.standard.uShininess, object.material.shininess ?? 32);
      gl.uniform1f(uniforms.standard.uAlpha, object.material.alpha ?? 1);

      gl.uniform1i(uniforms.standard.uUseDayTexture, object.material.dayTexture ? 1 : 0);
      gl.uniform1i(uniforms.standard.uUseNightTexture, object.material.nightTexture ? 1 : 0);
      gl.uniform1i(uniforms.standard.uUseSpecTexture, object.material.specTexture ? 1 : 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, object.material.dayTexture || null);
      gl.uniform1i(uniforms.standard.uDayTexture, 0);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, object.material.nightTexture || null);
      gl.uniform1i(uniforms.standard.uNightTexture, 2);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, object.material.specTexture || null);
      gl.uniform1i(uniforms.standard.uSpecTexture, 3);

      drawMesh(gl, object.mesh);
    }

    gl.disable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
    gl.viewport(0, 0, size.width, size.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programs.extract);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTarget.color);
    gl.uniform1i(uniforms.extract.uScene, 0);
    gl.uniform1f(uniforms.extract.uThreshold, BLOOM_THRESHOLD);
    drawFullscreenQuad(gl, quad);

    for (let i = 0; i < BLOOM_PASSES; i += 1) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
      gl.useProgram(programs.blur);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.color);
      gl.uniform1i(uniforms.blur.uImage, 0);
      gl.uniform2f(uniforms.blur.uTexel, BLOOM_BLUR_SCALE / size.width, BLOOM_BLUR_SCALE / size.height);
      gl.uniform2f(uniforms.blur.uDirection, 1, 0);
      drawFullscreenQuad(gl, quad);

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bloomB.color);
      gl.uniform1i(uniforms.blur.uImage, 0);
      gl.uniform2f(uniforms.blur.uDirection, 0, 1);
      drawFullscreenQuad(gl, quad);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.width, size.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programs.composite);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTarget.color);
    gl.uniform1i(uniforms.composite.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.color);
    gl.uniform1i(uniforms.composite.uBloom, 1);
    gl.uniform1f(uniforms.composite.uStrength, BLOOM_STRENGTH);
    drawFullscreenQuad(gl, quad);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

init().catch((error) => {
  console.error(error);
  statusEl.textContent = `Initialization error: ${error.message}`;
});
