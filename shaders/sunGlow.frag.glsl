precision highp float;

uniform float uTime;
uniform vec3 uGlowColor;
uniform vec3 uRimColor;
uniform float uIntensity;
uniform float uPulseSpeed;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.2);
  float pulse = 0.7 + 0.3 * sin(uTime * uPulseSpeed);
  float halo = smoothstep(0.1, 1.0, fresnel) * pulse;

  vec3 color = mix(uGlowColor, uRimColor, fresnel * 0.9);
  float alpha = clamp(halo * uIntensity, 0.0, 1.0);

  gl_FragColor = vec4(color * (0.65 + fresnel * 1.45), alpha);
}
