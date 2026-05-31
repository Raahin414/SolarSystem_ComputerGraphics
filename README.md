# Cinematic Mini Solar System (Pure WebGL)

A stylized, real-time mini solar system implemented in pure WebGL2 and GLSL. This repository contains a single canonical demo using raw WebGL.

## Highlights

- Shader-driven Sun glow with a timed pulse
- Orbiting planets with procedural and image-based textures
- Hierarchical moon orbits and debris clusters
- Bloom post-processing and simple ACES-like tone mapping
- Fog and atmospheric depth implemented in GLSL

## Tech stack

- WebGL2 + GLSL (shader sources in `webgl-solar-system/shaders/`)
- `gl-matrix` (bundled at `webgl-solar-system/lib/gl-matrix.js`) for math
- Vite — dev server and build tooling

## Quick start (development)

From the project root, install dev tools then run the demo directly with Vite:

```bash
npm install
npx vite webgl-solar-system --port 5182
```

Open the URL printed by Vite (for example `http://localhost:5182`).

## Project layout (key files)

- [webgl-solar-system/index.html](webgl-solar-system/index.html)
- [webgl-solar-system/src/main.js](webgl-solar-system/src/main.js) — bootstrap, render loop, post-process chain
- [webgl-solar-system/src/renderer.js](webgl-solar-system/src/renderer.js) — GL helpers, shader compilation
- [webgl-solar-system/src/scene.js](webgl-solar-system/src/scene.js) — scene construction and update logic
- [webgl-solar-system/src/shaders.js](webgl-solar-system/src/shaders.js) and [webgl-solar-system/shaders/](webgl-solar-system/shaders/) — GLSL sources
- [webgl-solar-system/src/textureLoader.js](webgl-solar-system/src/textureLoader.js) — image/cubemap loaders
- [webgl-solar-system/src/camera.js](webgl-solar-system/src/camera.js) — orbit camera
- [webgl-solar-system/lib/gl-matrix.js](webgl-solar-system/lib/gl-matrix.js)
- `screenshots/` — example captures used for documentation

## Implementation notes

- Everything in `webgl-solar-system/` is implemented with WebGL2 and GLSL (VAO/VBO/EBO, FBO-based postprocessing).
- The demo includes a multi-pass bloom (extract → blur → composite), Phong lighting in the fragment shader, fog, and environment cubemap support via the bundled texture loader.

## Troubleshooting

- If the canvas is blank, check the browser console for shader compile errors and ensure your GPU/browser supports WebGL2.
- If HDR/cubemap assets are missing, the demo falls back to built-in defaults; add assets to `webgl-solar-system/assets/` if desired.

## Credits & licenses

- HDRI assets (if used) are from Poly Haven — include attribution per their license when publishing.

---

Note: These changes are local only. I will not run any `git` commit or push unless you say "go." 
