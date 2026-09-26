import { useRef, useState } from 'react';
import NetworkCanvas from './NetworkCanvas.jsx';
import { authorityLevel } from '../data/samplePages.js';

export default function GraphExplorer({ graph, results }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const api = useRef({});
  const byId = (id) => graph.nodes.find((n) => n.id === id);
  const node = byId(selectedId);
  const relevance = results.find((r) => r.id === selectedId)?.relevance;
  return (
    <section id="graph" className="section">
      <h2>GRAPH EXPLORER</h2>
      <p className="muted">Drag to rotate, click a node to inspect it, Ctrl + scroll or the buttons to zoom. White lines are links pointing in; grey lines point out.</p>
      <div className="explorer">
        <div className="stage">
          <NetworkCanvas graph={graph} selectedId={selectedId} interactive apiRef={api} onSelect={setSelectedId} onHover={setHoverId} />
          <div className="zoom"><button aria-label="Zoom in" onClick={() => api.current.zoom(-2)}>+</button><button aria-label="Zoom out" onClick={() => api.current.zoom(2)}>−</button></div>
          {hoverId && <div className="tip">{byId(hoverId)?.title}</div>}
        </div>
        <aside className="card panel" aria-live="polite">
          {node ? (
            <>
              <h3>{node.title}</h3>
              <dl className="stats stack">
                <div><dt>PageRank</dt><dd>{node.pagerank.toFixed(3)}</dd></div>
                <div><dt>Incoming links</dt><dd>{node.incoming.length}</dd></div>
                <div><dt>Outgoing links</dt><dd>{node.outgoing.length}</dd></div>
                <div><dt>Relevance</dt><dd>{relevance != null ? (relevance * 100).toFixed(1) + '%' : 'not in current results'}</dd></div>
                <div><dt>Authority</dt><dd className={`auth ${authorityLevel(node.pagerank)}`}>{authorityLevel(node.pagerank)}</dd></div>
              </dl>
              <h4>Linked from</h4>
              <div className="chips">{node.incoming.map((id) => <button key={id} className="chip" onClick={() => setSelectedId(id)}>{byId(id)?.title}</button>)}</div>
            </>
          ) : <p className="muted">Select a page to see who links to it and how much authority it holds.</p>}
        </aside>
      </div>
    </section>
  );
}
