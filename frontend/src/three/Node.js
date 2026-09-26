import * as THREE from 'three';
// One shared sphere geometry for every page node (cheap on the GPU).
export const nodeGeometry = new THREE.SphereGeometry(1, 24, 24);
const LOW = new THREE.Color(0x565656), HIGH = new THREE.Color(0xffffff);

// Node size encodes PageRank: radius grows from 0.22 to 0.72.
export function createNodeMesh(node) {
  const baseColor = LOW.clone().lerp(HIGH, node.pagerank);
  const material = new THREE.MeshStandardMaterial({ color: baseColor, emissive: baseColor, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.2, transparent: true });
  const mesh = new THREE.Mesh(nodeGeometry, material);
  const size = 0.22 + node.pagerank * 0.5;
  mesh.scale.setScalar(size);
  mesh.userData = { id: node.id, size, targetScale: size, baseColor };
  return mesh;
}

// Visual states. Cyan = pages linking IN, violet = pages linked TO, amber = focus / search match.
const MODES = {
  base: { c: null, e: 0.3, s: 1, o: 1 }, dim: { c: 0x292929, e: 0.1, s: 0.85, o: 0.5 },
  selected: { c: 0xff9d42, e: 0.9, s: 1.3, o: 1 }, incoming: { c: 0xffffff, e: 0.7, s: 1.1, o: 1 },
  outgoing: { c: 0x8c8c96, e: 0.6, s: 1.05, o: 1 }, match: { c: 0xff9d42, e: 0.6, s: 1.1, o: 1 },
};
export function styleNode(mesh, mode) {
  const m = MODES[mode], mat = mesh.material;
  const color = m.c == null ? mesh.userData.baseColor : new THREE.Color(m.c);
  mat.color.copy(color); mat.emissive.copy(color); mat.emissiveIntensity = m.e; mat.opacity = m.o;
  mesh.userData.targetScale = mesh.userData.size * m.s; // eased toward in the render loop
}
