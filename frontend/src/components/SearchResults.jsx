import { useEffect, useState } from 'react';
import { useTilt } from '../hooks/useUi.js';
const pct = (v) => (v * 100).toFixed(1) + '%';

// Stages shown while searching. Each detail line states what that stage really does.
const PHASES = [
  { label: 'ANALYZING QUERY', detail: (q) => `terms: ${q.toLowerCase().split(/\s+/).filter(Boolean).join(', ')}` },
  { label: 'TRAVERSING GRAPH', detail: (q, g) => `${g.nodes.length} pages, ${g.edges.length} hyperlinks` },
  { label: 'CALCULATING PAGERANK', detail: () => 'PR(A) = (1−d)/N + d·Σ PR(i)/L(i)' },
  { label: 'RANKING RESULTS', detail: () => 'relevance and PageRank combined into one score' },
];

function ResultCard({ r, rank, graph, onOpen, onFocusId }) {
  const tilt = useTilt(6);
  const node = graph.nodes.find((n) => n.id === r.id);
  return (
    <article {...tilt} style={{ '--i': rank }} className="card result" tabIndex={0} role="button"
      onClick={() => onOpen(r)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r)}
      onPointerEnter={() => onFocusId(r.id)} onFocus={() => onFocusId(r.id)} onBlur={() => onFocusId(null)}
      onPointerLeave={(e) => { tilt.onPointerLeave(e); onFocusId(null); }}>
      <span className="rank">{String(rank).padStart(2, '0')}</span>
      <div>
        <h3>{r.title}</h3>
        <p className="muted url">{r.url}</p>
        <dl className="stats">
          <div><dt>Relevance</dt><dd>{pct(r.relevance)}</dd></div>
          <div><dt>PageRank</dt><dd>{pct(r.pagerank)}</dd></div>
          <div><dt>Incoming links</dt><dd>{node?.incoming.length ?? 0}</dd></div>
          <div><dt>Outgoing links</dt><dd>{node?.outgoing.length ?? 0}</dd></div>
        </dl>
      </div>
    </article>
  );
}

function Detail({ r, graph, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const node = graph.nodes.find((n) => n.id === r.id);
  const name = (id) => graph.nodes.find((n) => n.id === id)?.title || id;
  return (
    <div className="modal" onClick={onClose}>
      <div className="card detail" role="dialog" aria-modal="true" aria-label={r.title} onClick={(e) => e.stopPropagation()}>
        <h3>{r.title}</h3><p className="muted">{r.url}</p>
        <dl className="stats"><div><dt>Relevance</dt><dd>{pct(r.relevance)}</dd></div><div><dt>PageRank</dt><dd>{r.pagerank.toFixed(3)}</dd></div><div><dt>Final score</dt><dd>{r.score.toFixed(3)}</dd></div></dl>
        <h4>Linked from ({node?.incoming.length ?? 0})</h4><ul>{node?.incoming.map((id) => <li key={id}>{name(id)}</li>)}</ul>
        <h4>Links to ({node?.outgoing.length ?? 0})</h4><ul>{node?.outgoing.map((id) => <li key={id}>{name(id)}</li>)}</ul>
        <button className="btn" autoFocus onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function SearchResults({ phase, query, results, searched, graph, error, onFocusId, onSearch }) {
  const [open, setOpen] = useState(null);
  const running = phase >= 0 && phase < 4;
  return (
    <section id="search" className="section" aria-live="polite">
      <h2>SEARCH RESULTS</h2>
      {error && <p className="error">{error}</p>}
      {!searched && !running && (
        <p className="muted">Results appear here, ordered by relevance and PageRank. <button className="link" onClick={() => onSearch('machine learning')}>Try “machine learning”</button></p>
      )}
      {running && (
        <div className="load-row">
        <div className="loader" aria-hidden="true"><div className="cube" style={{ '--r': `${-phase * 90}deg` }}>{['QUERY', 'GRAPH', 'PAGERANK', 'RANK'].map((t, i) => <b key={t} className={`f f${i}`}>{t}</b>)}</div></div>
        <ol className="steps">
          {PHASES.map((p, i) => (
            <li key={p.label} className={i < phase ? 'done' : i === phase ? 'active' : ''}>
              <b>{p.label}</b><span>{i <= phase ? p.detail(query, graph) : ''}</span><i />
            </li>
          ))}
        </ol>
        </div>
      )}
      {searched && !running && phase === 4 && (
        <>
          <p className="muted">{results.length} results for “{query}”</p>
          <div className="results">{results.map((r, i) => <ResultCard key={r.id} r={r} rank={i + 1} graph={graph} onOpen={setOpen} onFocusId={onFocusId} />)}</div>
        </>
      )}
      {open && <Detail r={open} graph={graph} onClose={() => setOpen(null)} />}
    </section>
  );
}
