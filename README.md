# Cinematic Mini Solar System

A real-time computer graphics project built as a stylized mini solar system. The scene is designed to feel cinematic rather than physically exact: the Sun is the main focal point, the planets orbit hierarchically, and the lighting, bloom, fog, and background all work together to keep the image readable and atmospheric.

This repository contains the version of the project that is currently being used for submission. It is built with Three.js, custom GLSL shaders, procedural planet textures, environment lighting, and post-processing.

## What’s in the scene

- Sun with emissive glow and animated surface detail
- Orbiting planets with custom procedural textures
- Moon system attached to a planet hierarchy
- Reflective decorative object for material and lighting contrast
- Debris field / asteroid-style clusters
- Starfield background and fog for depth
- Bloom and tone mapping for the final cinematic look

## Tech stack

- Three.js
- GLSL shader materials
- EffectComposer post-processing
- OrbitControls for camera interaction
- Procedural canvas-based textures
- Vite for local development and bundling

## What was built, in order

1. Set up the real-time scene runtime with Three.js and Vite.
2. Built the Sun, orbiting planets, moon system, and debris field.
3. Added procedural planet textures, lighting, fog, and a starfield background.
4. Added bloom, tone mapping, and environment lighting for the final cinematic look.
5. Tuned the visuals, captured screenshots, and prepared the project for submission.

## Controls

- Drag to orbit the camera
- Scroll to zoom in and out

## Run locally

From the project root:

```bash
npm install
npm run dev
```

Then open the local Vite address shown in the terminal.

## Project structure

- `index.html` - app shell and on-screen UI
- `solarSystem.js` - main entry point
- `scene/` - scene runtime, solar system construction, animation
- `shaders/` - custom sun glow shaders
- `utils/` - asset helpers and environment loading
- `screenshots/` - saved renders from the current build

## Screenshots

Current screenshots from the running build are saved here:

- `screenshots/solar-system-01.png`
- `screenshots/solar-system-02.png`
- `screenshots/solar-system-03.png`

## Notes

- The project is focused on visual quality, depth, and a clean lighting hierarchy.
- If an HDRI or texture is unavailable, the scene still loads with fallback behavior.
- The final report can reference the saved screenshots in the `screenshots/` folder.
