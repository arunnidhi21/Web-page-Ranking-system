import { useRef } from 'react';
import SearchBar from './SearchBar.jsx';
import OrbCanvas from './OrbCanvas.jsx';
export default function Hero({ onSearch, busy, graph }) {
  const ref = useRef(null);
  // Pointer position becomes CSS variables --px/--py (-0.5..0.5): the heading tilts one way, the orb column drifts the other.
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    ref.current.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  return (
    <header id="home" className="hero" ref={ref} onPointerMove={onMove}>
      <div className="hero-copy">
        <h1><span>WEB SEARCH</span><span>RANKING SYSTEM</span></h1>
        <p className="lead">Discover how hyperlink relationships shape the importance of web pages.</p>
        <p className="muted">A graph-based search engine powered by PageRank and relevance scoring.</p>
        <SearchBar onSearch={onSearch} busy={busy} />
        <a className="btn ghost" href="#graph">EXPLORE</a>
      </div>
      <div className="orb" aria-hidden="true"><OrbCanvas graph={graph} /></div>
    </header>
  );
}
