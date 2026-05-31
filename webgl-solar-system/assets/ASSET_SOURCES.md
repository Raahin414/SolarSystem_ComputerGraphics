# Asset Research And Selection (Step 1)

This project is designed to use legally reusable assets from multiple sources.

## Selected Sources

1. Poly Haven (CC0 assets)
- HDRI: qwantani_night
- Info API: https://api.polyhaven.com/info/qwantani_night
- Files API: https://api.polyhaven.com/files/qwantani_night
- API docs: https://polyhaven.com/our-api

2. Sketchfab (downloadable Creative Commons models)
- Discovery page: https://sketchfab.com/features/free-3d-models
- Recommended searches for this project:
  - Planets: https://sketchfab.com/search?type=models&q=downloadable%20planet
  - Moon: https://sketchfab.com/search?type=models&q=downloadable%20moon
  - Sci-fi metal prop: https://sketchfab.com/search?type=models&q=downloadable%20sci-fi%20prop

3. Blend Swap (community Blender assets)
- Main portal: https://www.blendswap.com/
- Recommended searches for this project:
  - Asteroid/rocks: https://www.blendswap.com/search?keyword=asteroid
  - Space debris: https://www.blendswap.com/search?keyword=space%20debris

## Intended Asset Mapping

- /assets/hdr/space_px.jpg ... space_nz.jpg
  - Cubemap generated from Poly Haven HDRI (or equivalent space sky source)
- /assets/models/asteroid.obj
  - From Blend Swap or Sketchfab conversion/export
- /assets/textures/planet1.jpg .. planet4.jpg, moon.jpg, asteroid.jpg
  - Planet/moon/rock textures from Poly Haven (CC0) or equivalent licensed sources

## Current Real Texture Endpoints Used In Code

Solar System Scope (NASA-based texture set):

- Sun: https://www.solarsystemscope.com/textures/download/2k_sun.jpg
- Earth Day: https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
- Earth Night: https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg
- Earth Clouds: https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg
- Earth Specular: https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.jpg
- Moon: https://www.solarsystemscope.com/textures/download/2k_moon.jpg
- Mars: https://www.solarsystemscope.com/textures/download/2k_mars.jpg
- Jupiter: https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg
- Saturn: https://www.solarsystemscope.com/textures/download/2k_saturn.jpg
- Saturn Ring Alpha: https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png

Starfield cubemap sources (replace with hosted or local assets before production):

- Milky Way cubemap faces (example placeholders) — recommend downloading suitable cubemap images from public-domain or CC0 sources and storing them under `webgl-solar-system/assets/hdr/`.

- Recommended sources:
  - Poly Haven (HDRIs and panoramic skies): https://polyhaven.com/
  - NASA / public domain astronomy textures: https://svs.gsfc.nasa.gov/ or https://visibleearth.nasa.gov/
  - Own generated or curated cubemap images stored in `webgl-solar-system/assets/` for offline stability

## License And Attribution Policy

- Poly Haven: CC0 assets where applicable, keep source mention in report.
- Sketchfab: use downloadable models with explicit Creative Commons licenses and provide per-model attribution in your final report.
- Blend Swap: verify each model license on the model page before use and include attribution if required.

## Notes

Because licenses vary by model for Sketchfab/Blend Swap, verify each chosen asset before final submission.
