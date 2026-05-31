#version 300 es
precision highp float;

in vec3 vWorldPos;
in vec3 vNormal;
in vec2 vUV;

uniform vec3 uCameraPos;
uniform vec3 uLightPos;
uniform vec3 uPointLightPos;
uniform vec3 uPointLightColor;
uniform float uPointLightIntensity;
uniform float uPointLightRange;
uniform float uAmbientFill;
uniform vec3 uAlbedo;
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecTexture;
uniform bool uUseDayTexture;
uniform bool uUseNightTexture;
uniform bool uUseSpecTexture;
uniform float uNightStrength;
uniform float uSpecStrength;
uniform float uShininess;
uniform float uAlpha;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPos - vWorldPos);
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);

  vec3 base = uUseDayTexture ? texture(uDayTexture, vUV).rgb : uAlbedo;
  vec3 night = uUseNightTexture ? texture(uNightTexture, vUV).rgb : vec3(0.0);
  float specMask = uUseSpecTexture ? texture(uSpecTexture, vUV).r : 1.0;

  float ambient = uAmbientFill;
  float diffuse = max(dot(normal, lightDir), 0.0);
  float litSide = smoothstep(0.02, 0.22, diffuse);
  float spec = pow(max(dot(normal, halfDir), 0.0), uShininess) * (uSpecStrength * 0.82) * specMask * litSide;

  float dist = length(uLightPos - vWorldPos);
  float attenuation = 1.0 / (1.0 + 0.016 * dist + 0.0011 * dist * dist);

  vec3 toPoint = uPointLightPos - vWorldPos;
  float pointDist = max(length(toPoint), 0.0001);
  vec3 pointDir = toPoint / pointDist;
  float pointRange = clamp(1.0 - pointDist / uPointLightRange, 0.0, 1.0);
  float pointAtt = pointRange * pointRange * uPointLightIntensity;
  float pointDiffuse = max(dot(normal, pointDir), 0.0);
  vec3 pointHalf = normalize(pointDir + viewDir);
  float pointSpec = pow(max(dot(normal, pointHalf), 0.0), uShininess) * (uSpecStrength * 0.42) * specMask * pointDiffuse;

  float nightFactor = pow(clamp(1.0 - diffuse, 0.0, 1.0), 2.15);
  vec3 nightEmission = night * nightFactor * uNightStrength;

  float diffuseLight = diffuse * attenuation * 0.92;
  vec3 mainLight = base * (ambient + diffuseLight) + vec3(spec * attenuation);
  vec3 fillLight = uPointLightColor * (base * pointDiffuse * pointAtt + vec3(pointSpec * pointAtt));
  vec3 lit = mainLight + fillLight + nightEmission;

  float fog = clamp(exp(-0.00145 * dist * dist), 0.0, 1.0);
  vec3 fogColor = vec3(0.03, 0.041, 0.072);

  fragColor = vec4(mix(fogColor, lit, fog), uAlpha);
}
