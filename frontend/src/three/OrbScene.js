import * as THREE from 'three';
import { createParticleFlow } from './ParticleFlow.js';

const ORANGE = 0xff9d42;
const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Soft radial gradient drawn once on a canvas; used as an additive "glow" sprite behind the core.
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,235,210,1)'); grad.addColorStop(0.25, 'rgba(255,157,66,.55)'); grad.addColorStop(1, 'rgba(255,157,66,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Hero centrepiece: a glowing core inside a glass shell and a wireframe cage.
// The cage has 12 vertices (one per sample page, sized by PageRank) and 30 edges carrying particles: a hyperlink graph, stylised.
export class OrbScene {
  constructor(container, graph, { lowPower = false } = {}) {
    this.container = container; this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mouse = { x: 0, y: 0 }; this.t = 0; this.age = 0; this.running = false; this.raf = null;
    this.renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 2));
    container.appendChild(this.renderer.domElement); this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); this.camera.position.z = 11;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 5); this.scene.add(key);
    this.scene.add(new THREE.PointLight(ORANGE, 60, 16, 2)); // the core lights the debris orange
    this.group = new THREE.Group(); this.scene.add(this.group);

    // core, halo and glass shell
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffe2c2 }));
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.halo.scale.setScalar(5.2);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    // ring of glowing segments (like the reference's neon ring) that spins around the core
    const tilt = new THREE.Group(); tilt.rotation.set(0.4, 0, 0.25);
    const segs = 40, dummy = new THREE.Object3D();
    this.ring = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: ORANGE }), segs);
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15); dummy.rotation.y = Math.PI / 2 - a; dummy.updateMatrix(); this.ring.setMatrixAt(i, dummy.matrix);
    }
    tilt.add(this.ring); this.group.add(this.core, this.halo, shell, tilt);

    // wireframe cage: icosahedron = 12 vertices, 30 edges
    this.cageGroup = new THREE.Group(); this.group.add(this.cageGroup);
    const ico = new THREE.IcosahedronGeometry(2.45, 0), edgeGeo = new THREE.EdgesGeometry(ico);
    this.cageGroup.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })));
    const key3 = (a, i) => [a.getX(i), a.getY(i), a.getZ(i)].map((v) => v.toFixed(3)).join();
    const verts = [], index = new Map(), p = ico.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = key3(p, i); if (!index.has(k)) { index.set(k, verts.length); verts.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i))); } }
    const ep = edgeGeo.attributes.position, edges = [];
    for (let i = 0; i < ep.count; i += 2) edges.push({ source: index.get(key3(ep, i)), target: index.get(key3(ep, i + 1)) });
    const nodeGeo = new THREE.SphereGeometry(1, 16, 16), white = new THREE.MeshBasicMaterial({ color: 0xffffff }), warm = new THREE.MeshBasicMaterial({ color: ORANGE });
    verts.forEach((v, i) => { // vertex size = PageRank of the i-th sample page
      const pr = graph.nodes[i]?.pagerank ?? 0.3, m = new THREE.Mesh(nodeGeo, pr > 0.6 ? warm : white);
      m.position.copy(v); m.scale.setScalar(0.07 + pr * 0.13); this.cageGroup.add(m);
    });
    this.flow = createParticleFlow(edges, new Map(verts.map((v, i) => [i, v])), lowPower ? 1 : 2); this.cageGroup.add(this.flow);

    // orbit ring with a satellite
    this.orbit = new THREE.Group(); this.orbit.rotation.set(1.2, 0, 0.35); this.group.add(this.orbit);
    this.orbit.add(new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.015, 8, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })));
    this.sat = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), warm); this.orbit.add(this.sat);

    // floating debris cubes
    this.debris = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1), boxMat = new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.9, roughness: 0.35 });
    for (let i = 0; i < (lowPower ? 8 : 16); i++) {
      const m = new THREE.Mesh(boxGeo, boxMat), dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(3.8, 5.3));
      m.position.copy(dir); m.scale.setScalar(rand(0.1, 0.28));
      m.userData = { base: dir.clone(), spin: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)), phase: rand(0, 6.28) };
      this.group.add(m); this.debris.push(m);
    }

    this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(container); this._resize();
    this.io = new IntersectionObserver(([e]) => { // lazy: only render while visible
      this.running = e.isIntersecting;
      if (this.running && !this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this._tick); }
    });
    this.io.observe(container);
    this._onMove = (e) => { this.mouse.x = e.clientX / innerWidth - 0.5; this.mouse.y = e.clientY / innerHeight - 0.5; };
    window.addEventListener('pointermove', this._onMove, { passive: true });
  }

  _resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  _tick = (now) => {
    this.raf = null;
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05); this.last = now;
    const step = this.reduced ? 0 : dt; // reduced motion: static pose, no spinning or particles
    this.t += step; this.age += dt;
    const intro = this.reduced ? 1 : easeOut(Math.min(this.age / 1.6, 1)); // scale-and-spin entrance
    this.group.scale.setScalar(0.55 + 0.45 * intro);
    const pulse = Math.sin(this.t * 2);
    this.core.scale.setScalar(1 + 0.06 * pulse); this.halo.scale.setScalar(5.2 + 0.35 * pulse); this.halo.material.opacity = 0.8 + 0.15 * pulse;
    this.cageGroup.rotation.y += step * 0.15; this.cageGroup.rotation.x += step * 0.05;
    this.ring.rotation.y -= step * 0.6;
    this.sat.position.set(Math.cos(this.t * 0.6) * 3.3, Math.sin(this.t * 0.6) * 3.3, 0);
    this.debris.forEach((m) => {
      const d = m.userData; m.rotation.x += d.spin.x * step; m.rotation.y += d.spin.y * step; m.rotation.z += d.spin.z * step;
      m.position.y = d.base.y + Math.sin(this.t * 0.8 + d.phase) * 0.18;
    });
    this.flow.userData.update(step);
    this.group.rotation.y += (this.mouse.x * 0.6 + (1 - intro) * Math.PI - this.group.rotation.y) * 0.06; // pointer parallax
    this.group.rotation.x += (this.mouse.y * 0.4 - this.group.rotation.x) * 0.06;
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this._tick);
  };

  dispose() {
    cancelAnimationFrame(this.raf); this.running = false; this.ro.disconnect(); this.io.disconnect();
    window.removeEventListener('pointermove', this._onMove);
    this.scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    this.renderer.dispose(); this.canvas.remove();
  }
}
