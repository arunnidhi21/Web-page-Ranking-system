import * as THREE from 'three';
const COLORS = { base: new THREE.Color(0x525252), faint: new THREE.Color(0x141c2b), in: new THREE.Color(0xffffff), out: new THREE.Color(0x8c8c96), match: new THREE.Color(0xff9d42) };

// All hyperlinks in one LineSegments draw call; per-vertex colours are updated on highlight.
export function createLinks(edges, positions) {
  const verts = new Float32Array(edges.length * 6);
  edges.forEach((e, i) => { positions.get(e.source).toArray(verts, i * 6); positions.get(e.target).toArray(verts, i * 6 + 3); });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
}

export function styleLinks(lines, edges, focusId, matchIds) {
  const attr = lines.geometry.attributes.color;
  edges.forEach((e, i) => {
    let c = COLORS.base;
    if (focusId) c = e.target === focusId ? COLORS.in : e.source === focusId ? COLORS.out : COLORS.faint;
    else if (matchIds.size) c = matchIds.has(e.source) && matchIds.has(e.target) ? COLORS.match : COLORS.faint;
    attr.setXYZ(i * 2, c.r, c.g, c.b); attr.setXYZ(i * 2 + 1, c.r, c.g, c.b);
  });
  attr.needsUpdate = true;
}
