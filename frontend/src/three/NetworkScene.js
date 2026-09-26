import * as THREE from 'three';
import { createNodeMesh, styleNode, nodeGeometry } from './Node.js';
import { createLinks, styleLinks } from './Link.js';
import { createParticleFlow } from './ParticleFlow.js';

// Force-directed 3D layout, computed once: nodes repel, hyperlinks act as springs, everything is pulled to the centre.
function layout(nodes, edges) {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const pos = nodes.map((_, i) => { // start on a sphere (golden spiral) so the result is deterministic
    const y = 1 - (i / Math.max(nodes.length - 1, 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(3);
  });
  for (let it = 0; it < 200; it++) {
    const force = pos.map(() => new THREE.Vector3());
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
      const d = pos[i].clone().sub(pos[j]), dist = Math.max(d.length(), 0.1);
      const f = d.normalize().multiplyScalar(4 / (dist * dist));
      force[i].add(f); force[j].sub(f);
    }
    edges.forEach((e) => {
      const a = index.get(e.source), b = index.get(e.target);
      if (a === undefined || b === undefined) return;
      const d = pos[b].clone().sub(pos[a]), pull = d.normalize().multiplyScalar((d.length() - 2.6) * 0.05);
      force[a].add(pull); force[b].sub(pull);
    });
    pos.forEach((p, i) => p.addScaledVector(force[i].addScaledVector(p, -0.02), 0.3));
  }
  const radius = Math.max(...pos.map((p) => p.length()), 1);
  return new Map(nodes.map((n, i) => [n.id, pos[i].multiplyScalar(4.2 / radius)]));
}

export class NetworkScene {
  constructor(container, graph, opts = {}) {
    this.opts = { interactive: false, lowPower: false, autoRotate: true, ...opts };
    this.container = container; this.graph = graph;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.selectedId = null; this.hoverId = null; this.ids = new Set(); this.rings = []; this._q = new THREE.Quaternion();
    this.rot = { x: 0.2, y: 0 }; this.target = { x: 0.2, y: 0 }; this.mouse = { x: 0, y: 0 };
    this.zoomTarget = this.opts.interactive ? 11 : 13; this.dragging = false; this.running = false; this.raf = null;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.opts.lowPower, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.opts.lowPower ? 1 : 1.75)); // cap pixel ratio for performance
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.z = this.zoomTarget;
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xd3d3d3, 2.2); key.position.set(5, 8, 6); this.scene.add(key);

    // Everything lives in one group so rotating the group rotates the whole graph.
    this.group = new THREE.Group(); this.scene.add(this.group);
    const positions = layout(graph.nodes, graph.edges);
    this.edges = graph.edges.filter((e) => positions.has(e.source) && positions.has(e.target));
    this.meshes = graph.nodes.map((n) => { const m = createNodeMesh(n); m.position.copy(positions.get(n.id)); this.group.add(m); return m; });
    this.links = createLinks(this.edges, positions); this.group.add(this.links);
    this.flow = createParticleFlow(this.edges, positions, this.opts.lowPower ? 1 : 2); this.group.add(this.flow);
    this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this._restyle();

    this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(container); this._resize();
    this.io = new IntersectionObserver(([e]) => { // lazy: only render while on screen
      this.running = e.isIntersecting;
      if (this.running && !this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this._tick); }
    });
    this.io.observe(container);
    this._bind();
  }

  _resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  _bind() {
    if (!this.opts.interactive) { // background mode: gentle parallax from the pointer anywhere on the page
      this._onWindowMove = (e) => { this.mouse.x = e.clientX / innerWidth - 0.5; this.mouse.y = e.clientY / innerHeight - 0.5; };
      window.addEventListener('pointermove', this._onWindowMove, { passive: true });
      return;
    }
    let sx = 0, sy = 0, moved = 0;
    this._down = (e) => { this.dragging = true; sx = e.clientX; sy = e.clientY; moved = 0; this.canvas.setPointerCapture(e.pointerId); };
    this._move = (e) => {
      if (this.dragging) { // drag = orbit the graph
        this.target.y += (e.clientX - sx) * 0.006; this.target.x = Math.max(-1.2, Math.min(1.2, this.target.x + (e.clientY - sy) * 0.006));
        moved += Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy); sx = e.clientX; sy = e.clientY; return;
      }
      const id = this._pick(e);
      if (id !== this.hoverId) { this.hoverId = id; this._restyle(); this.opts.onHover?.(id); }
      this.canvas.style.cursor = id ? 'pointer' : 'grab';
    };
    this._up = (e) => { this.dragging = false; if (moved < 4) this.opts.onSelect?.(this._pick(e)); };
    this._leave = () => { if (this.hoverId) { this.hoverId = null; this._restyle(); this.opts.onHover?.(null); } };
    this._wheel = (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.zoom(e.deltaY * 0.02); } }; // page scroll stays normal
    this.canvas.addEventListener('pointerdown', this._down); this.canvas.addEventListener('pointermove', this._move);
    this.canvas.addEventListener('pointerup', this._up); this.canvas.addEventListener('pointerleave', this._leave);
    this.canvas.addEventListener('wheel', this._wheel, { passive: false });
    this.canvas.style.cursor = 'grab'; this.canvas.style.touchAction = 'pan-y';
  }

  // Raycast from the cursor into the scene and return the id of the nearest node hit.
  _pick(e) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.ray.intersectObjects(this.meshes, false)[0]?.object.userData.id ?? null;
  }

  zoom(delta) { this.zoomTarget = Math.max(6, Math.min(20, this.zoomTarget + delta)); }
  setHighlight(selectedId, ids = []) {
    const changed = selectedId && selectedId !== this.selectedId;
    this.selectedId = selectedId; this.ids = new Set(ids); this._restyle();
    if (changed && this.opts.interactive && !this.reduced) this._pulse(selectedId);
  }

  // Expanding ring around a newly selected node. It is a child of the node, so it follows the graph as it rotates.
  _pulse(id) {
    const mesh = this.meshes.find((m) => m.userData.id === id);
    if (!mesh) return;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff9d42, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.userData.age = 0; mesh.add(ring); this.rings.push(ring);
  }

  // Focus (hover or selection) shows incoming links in cyan and outgoing in violet; otherwise search matches glow amber.
  _restyle() {
    const focus = this.hoverId ?? this.selectedId, inc = new Set(), out = new Set();
    if (focus) this.edges.forEach((e) => { if (e.target === focus) inc.add(e.source); if (e.source === focus) out.add(e.target); });
    this.meshes.forEach((m) => {
      const id = m.userData.id; let mode = 'base';
      if (focus) mode = id === focus ? 'selected' : inc.has(id) ? 'incoming' : out.has(id) ? 'outgoing' : 'dim';
      else if (this.ids.size) mode = this.ids.has(id) ? 'match' : 'dim';
      styleNode(m, mode);
    });
    styleLinks(this.links, this.edges, focus, this.ids);
  }

  _tick = (now) => {
    this.raf = null;
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05); this.last = now;
    if (!this.reduced) { // reduced motion: no auto-rotation, sway or particles
      if (this.opts.autoRotate && !this.dragging) this.target.y += dt * 0.07;
      this.flow.userData.update(dt);
    }
    this.rings = this.rings.filter((r) => { // grow, fade, then free the GPU memory
      r.userData.age += dt; const t = r.userData.age / 1.1;
      if (t >= 1) { r.parent.remove(r); r.geometry.dispose(); r.material.dispose(); return false; }
      r.scale.setScalar(1.2 + t * 3.5); r.material.opacity = 0.9 * (1 - t);
      r.parent.getWorldQuaternion(this._q).invert(); r.quaternion.copy(this._q).multiply(this.camera.quaternion); // always face the camera
      return true;
    });
    const sway = this.reduced || this.opts.interactive ? { x: 0, y: 0 } : this.mouse;
    this.rot.x += (this.target.x + sway.y * 0.3 - this.rot.x) * 0.06; this.rot.y += (this.target.y + sway.x * 0.5 - this.rot.y) * 0.06;
    this.group.rotation.set(this.rot.x, this.rot.y, 0);
    this.camera.position.z += (this.zoomTarget - this.camera.position.z) * 0.08;
    this.meshes.forEach((m) => m.scale.setScalar(m.scale.x + (m.userData.targetScale - m.scale.x) * 0.15));
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this._tick);
  };

  dispose() { // release every GPU resource and listener
    cancelAnimationFrame(this.raf); this.running = false; this.ro.disconnect(); this.io.disconnect();
    if (this._onWindowMove) window.removeEventListener('pointermove', this._onWindowMove);
    this.meshes.forEach((m) => m.material.dispose()); nodeGeometry.dispose();
    [this.links, this.flow].forEach((o) => { o.geometry.dispose(); o.material.dispose(); });
    this.renderer.dispose(); this.canvas.remove();
  }
}
