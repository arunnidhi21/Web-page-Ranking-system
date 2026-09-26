import { useMemo, useState } from 'react';
import { useCountUp, useInView } from '../hooks/useUi.js';
import ConvergenceChart from './ConvergenceChart.jsx';
import Podium from './Podium.jsx';

// Glass stat card: animated number plus a hatched progress bar (value is 0..1).
function Stat({ label, value, active }) {
  const shown = useCountUp(value, active);
  return <div className="stat"><span>{label}</span><b>{shown.toFixed(3)}</b><div className="track"><i style={{ '--w': active ? value : 0 }} /></div></div>;
}

export default function RankingVisualization({ results, graph, onFocusId }) {
  const [alpha, setAlpha] = useState(0.5); // weight given to text relevance
  const [ref, inView] = useInView();
  // Final ranking = alpha * relevance + (1 - alpha) * PageRank. The slider re-ranks live.
  const top = useMemo(() => results.map((r) => ({ ...r, final: alpha * r.relevance + (1 - alpha) * r.pagerank })).sort((a, b) => b.final - a.final).slice(0, 3), [results, alpha]);
  return (
    <section id="ranking" className="section" ref={ref}>
      <h2>RANKING INTELLIGENCE</h2>
      <p className="lead">Relevance score + PageRank = final ranking. Larger nodes belong to pages with more authority.</p>
      <label className="slider">Weight on relevance: {Math.round(alpha * 100)}%
        <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
      </label>
      <Podium top={top} />
      <p className="muted">Column height = final score. Move the slider to re-rank.</p>
      <div className="rank-rows">
        {top.map((r) => (
          <div className="card rank-row" key={r.id} onPointerEnter={() => onFocusId(r.id)} onPointerLeave={() => onFocusId(null)}>
            <div className="orb-wrap"><div className="orb" style={{ '--size': `${44 + r.pagerank * 80}px` }} /></div>
            <div><h3>{r.title}</h3>
              <div className="stat-row"><Stat label="PageRank" value={r.pagerank} active={inView} /><Stat label="Relevance" value={r.relevance} active={inView} /><Stat label="Final score" value={r.final} active={inView} /></div>
            </div>
          </div>
        ))}
        <div className="card chart-card">
          <h3>PAGERANK CONVERGENCE</h3>
          <p className="muted">Each iteration passes scores along links until they settle. Raw scores sum to 1 across all pages. Hover the chart to read values.</p>
          <ConvergenceChart graph={graph} pages={top} />
        </div>
      </div>
    </section>
  );
}
