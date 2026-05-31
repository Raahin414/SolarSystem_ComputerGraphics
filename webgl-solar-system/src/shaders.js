async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load shader: ${url}`);
  return r.text();
}

function splitCombined(src) {
  const out = { vertex: '', fragment: '' };
  for (const s of src.split(/^#shader\s+/m).map((v) => v.trim()).filter(Boolean)) {
    const i = s.indexOf('\n');
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    if (k === 'vertex' || k === 'fragment') out[k] = s.slice(i + 1);
  }
  return out;
}

export async function loadShaderSources() {
  const [vertex, fragment, sunRaw] = await Promise.all([
    text('./shaders/vertex.glsl'),
    text('./shaders/fragment.glsl'),
    text('./shaders/sun.glsl')
  ]);
  return { standard: { vertex, fragment }, sun: splitCombined(sunRaw) };
}
