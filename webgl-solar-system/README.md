# WebGL Solar System (Pure WebGL)

This project is a fresh implementation of the mini solar system scene using only WebGL2 + GLSL + vanilla JS.

## Run

From the workspace root:

- `npx vite webgl-solar-system --port 5180`
- Open `http://localhost:5180/`

## Controls

- Drag mouse: orbit camera
- Scroll: zoom in/out

## Engine Features

- Custom shader/program compilation pipeline
- VBO/VAO mesh buffers
- Model/View/Projection matrices
- Hierarchical orbit animation (planet + moon)
- Blinn-Phong shading with attenuation
- Basic shadow mapping pass (light depth map)
- Cubemap skybox + reflection + refraction shaders
- OBJ model loader (optional asteroid model)
- Texture loader + cubemap loader with runtime fallback

## Asset Placement

Place optional assets here:

- `assets/models/asteroid.obj`
- `assets/textures/planet1.jpg`
- `assets/textures/planet2.jpg`
- `assets/textures/planet3.jpg`
- `assets/textures/planet4.jpg`
- `assets/textures/moon.jpg`
- `assets/textures/asteroid.jpg`
- `assets/hdr/space_px.jpg`
- `assets/hdr/space_nx.jpg`
- `assets/hdr/space_py.jpg`
- `assets/hdr/space_ny.jpg`
- `assets/hdr/space_pz.jpg`
- `assets/hdr/space_nz.jpg`

If assets are missing, the scene still runs with procedural/fallback textures so development is uninterrupted.

## Research And Licensing

See `assets/ASSET_SOURCES.md` for the mandatory multi-source asset selection and attribution plan.
