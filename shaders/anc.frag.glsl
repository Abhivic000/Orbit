// ANC ripple - fragment shader. Runs once per pixel the shell covers and
// decides its colour + alpha.
//
// fresnel: surfaces seen edge-on (normal perpendicular to view direction) glow, surfaces
// facing the camera stay clear - so the shell reads as a soft halo around the
// cup instead of a coloured blob over it.

uniform vec3 uColor;
uniform float uStrength;

varying vec3 vNormalW;
varying vec3 vViewDirW;
varying float vRing;

void main() {
  float facing = abs(dot(normalize(vNormalW), normalize(vViewDirW)));
  float fresnel = pow(1.0 - facing, 2.5);
  // Thin bright bands on the ring crests.
  float bands = smoothstep(0.55, 1.0, vRing);
  float alpha = fresnel * (0.25 + 0.75 * bands) * uStrength * 0.55;
  gl_FragColor = vec4(uColor, alpha);
  // three.js chunk: convert linear -> output colour space, like built-in materials.
  #include <colorspace_fragment>
}
