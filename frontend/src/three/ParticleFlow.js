import * as THREE from 'three';
// Points travelling source -> target along every hyperlink: the "importance flows through links" idea.
// Count = edges * perEdge, updated in one typed array and drawn in one call.
export function createParticleFlow(edges, positions, perEdge = 2) {
  const particles = [];
  edges.forEach((e) => { for (let k = 0; k < perEdge; k++) particles.push({ a: positions.get(e.source), b: positions.get(e.target), t: (k + Math.random() * 0.4) / perEdge, speed: 0.16 + Math.random() * 0.1 }); });
  const arr = new Float32Array(particles.length * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf2f2f4, size: 0.08, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  points.userData.update = (dt) => {
    particles.forEach((p, i) => {
      p.t = (p.t + dt * p.speed) % 1;
      arr[i * 3] = p.a.x + (p.b.x - p.a.x) * p.t; arr[i * 3 + 1] = p.a.y + (p.b.y - p.a.y) * p.t; arr[i * 3 + 2] = p.a.z + (p.b.z - p.a.z) * p.t;
    });
    geometry.attributes.position.needsUpdate = true;
  };
  points.userData.update(0);
  return points;
}
