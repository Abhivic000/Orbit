// ANC ripple - vertex shader. Runs once per vertex of the shell around each cup.
//
// The shell is a sphere squashed to the cup's shape. Its local +x axis points
// out of the cup, so "distance from the pole" is the angle between the vertex
// direction and +x. Rings travel outward from the pole as time advances, and
// each vertex is pushed along its normal by the ring height.

uniform float uTime;      // seconds
uniform float uStrength;  // 0 -> 1, scroll-driven
uniform float uBands;     // number of rings across the shell
uniform float uSpeed;     // ring speed (bands per second)

varying vec3 vNormalW;    // world-space normal  -> fragment (fresnel)
varying vec3 vViewDirW;   // world-space view dir -> fragment (fresnel)
varying float vRing;      // 0..1 ring phase    -> fragment (bands)

void main() {
  // 0 at the outer pole, 1 at the opposite side.
  float d = acos(clamp(normalize(position).x, -1.0, 1.0)) / 3.14159265;
  float wave = sin((d * uBands - uTime * uSpeed) * 6.2831853);
  vRing = wave * 0.5 + 0.5;

  // Displace along the normal: small, and only while ANC is "on".
  vec3 displaced = position + normal * wave * 0.035 * uStrength;

  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDirW = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
