import { useState } from 'react';
// Tiny 3-page web from the brief: A→B, A→C, B→C, C→A. Each "Run iteration" applies the real PageRank formula once.
const NODES = { A: { x: 90, y: 70 }, B: { x: 330, y: 70 }, C: { x: 210, y: 225 } };
const LINKS = [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'A']];
const START = { A: 1 / 3, B: 1 / 3, C: 1 / 3 };
const outCount = (id) => LINKS.filter((l) => l[0] === id).length;

export default function PageRankExplanation() {
  const [d, setD] = useState(0.85);
  const [pr, setPr] = useState(START);
  const [iter, setIter] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const radius = (id) => 16 + pr[id] * 60;
  const step = () => {
    const next = {};
    Object.keys(NODES).forEach((id) => {
      next[id] = (1 - d) / 3 + LINKS.filter((l) => l[1] === id).reduce((s, [src]) => s + (d * pr[src]) / outCount(src), 0);
    });
    setPr(next); setIter((i) => i + 1);
  };
  const edgeGeometry = ([from, to]) => { // curved path shortened to node edges, plus label position
    const a = NODES[from], b = NODES[to], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const s = { x: a.x + ux * radius(from), y: a.y + uy * radius(from) }, e = { x: b.x - ux * (radius(to) + 6), y: b.y - uy * (radius(to) + 6) };
    const c = { x: (a.x + b.x) / 2 - uy * 26, y: (a.y + b.y) / 2 + ux * 26 };
    return { path: `M${s.x} ${s.y} Q${c.x} ${c.y} ${e.x} ${e.y}`, lx: 0.25 * s.x + 0.5 * c.x + 0.25 * e.x, ly: 0.25 * s.y + 0.5 * c.y + 0.25 * e.y };
  };
  return (
    <section id="algorithm" className="section">
      <h2>HOW PAGERANK WORKS</h2>
      <p className="lead">A page becomes more important when important pages link to it.</p>
      <div className="pr-grid">
        <div className="card">
          <svg viewBox="0 0 420 290" role="img" aria-label="Three pages A, B and C exchanging PageRank through links">
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ffffff" /></marker></defs>
            {LINKS.map((l) => {
              const g = edgeGeometry(l);
              return (
                <g key={l.join('')}>
                  <path d={g.path} fill="none" stroke="#525252" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <circle r="3" fill="#f2f2f4" className="flow"><animateMotion dur="2.4s" repeatCount="indefinite" path={g.path} /></circle>
                  <text x={g.lx} y={g.ly} className="edge-label">{((d * pr[l[0]]) / outCount(l[0])).toFixed(3)}</text>
                </g>
              );
            })}
            {Object.entries(NODES).map(([id, p]) => (
              <g key={id}>
                <circle cx={p.x} cy={p.y} r={radius(id)} fill="#ffffff" fillOpacity={0.15 + pr[id] * 0.6} stroke="#ffffff" />
                <text x={p.x} y={p.y - 2} className="node-id">{id}</text><text x={p.x} y={p.y + 14} className="node-val">{pr[id].toFixed(3)}</text>
              </g>
            ))}
          </svg>
          <div className="controls">
            <button className="btn" onClick={step}>Run iteration</button>
            <button className="btn ghost" onClick={() => { setPr(START); setIter(0); }}>Reset</button>
            <label>Damping d = {d.toFixed(2)}<input type="range" min="0.5" max="0.95" step="0.05" value={d} onChange={(e) => setD(+e.target.value)} /></label>
            <span className="muted">Iteration {iter}. Numbers on links are the score each page passes on.</span>
          </div>
        </div>
        {/* Flip card: formula on the front, plain-language variables on the back */}
        <div className={`flip ${flipped ? 'flipped' : ''}`}>
          <div className="card formula face front">
            <p className="eq">PR(A) = (1 − d) / N + d · Σ PR(i) / L(i)</p>
            <p className="muted">Each page splits its score evenly across its outgoing links, then damping keeps every page's baseline above zero.</p>
            <button className="btn ghost" onClick={() => setFlipped(true)}>What do the symbols mean?</button>
          </div>
          <div className="card formula face back">
            <dl>
            <dt>PR(A)</dt><dd>PageRank of the page being scored</dd>
            <dt>d</dt><dd>Damping factor: the chance a reader follows a link instead of jumping to a random page (usually 0.85)</dd>
            <dt>N</dt><dd>Total number of pages</dd>
            <dt>PR(i)</dt><dd>PageRank of each page i that links to A</dd>
            <dt>L(i)</dt><dd>Number of outgoing links on page i, which splits its score evenly</dd>
          </dl>
            <button className="btn ghost" onClick={() => setFlipped(false)}>Back to formula</button>
          </div>
        </div>
      </div>
    </section>
  );
}
