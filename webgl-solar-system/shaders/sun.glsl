#shader vertex
#version 300 es
layout(location = 0) in vec3 aPosition;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vLocal;

void main() {
  vLocal = aPosition;
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}

#shader fragment
#version 300 es
precision highp float;

in vec3 vLocal;
uniform float uTime;
uniform sampler2D uSunTexture;

out vec4 fragColor;

vec2 sphericalUV(vec3 n) {
  vec3 nn = normalize(n);
  float u = atan(nn.z, nn.x) / (2.0 * 3.14159265) + 0.5;
  float v = nn.y * 0.5 + 0.5;
  return vec2(u, v);
}

void main() {
  float r = length(vLocal);
  vec2 uv = sphericalUV(vLocal);
  uv.x += uTime * 0.004;

  vec3 tex = max(texture(uSunTexture, uv).rgb, vec3(0.32, 0.2, 0.08));
  float glow = 1.0 - smoothstep(0.28, 1.28, r);
  float pulse = 0.92 + 0.08 * sin(uTime * 1.4 + vLocal.y * 7.0);
  vec3 core = tex * vec3(1.28, 1.04, 0.66);
  vec3 rim = vec3(1.0, 0.45, 0.18);
  vec3 texturedRim = rim * (0.55 + 0.9 * tex);
  vec3 color = mix(texturedRim, core, glow) * pulse * 0.99;
  fragColor = vec4(color, 1.0);
}
