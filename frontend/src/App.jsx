import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import SearchResults from './components/SearchResults.jsx';
import RankingVisualization from './components/RankingVisualization.jsx';
import GraphExplorer from './components/GraphExplorer.jsx';
import PageRankExplanation from './components/PageRankExplanation.jsx';
import AlgorithmPipeline from './components/AlgorithmPipeline.jsx';
import TechStack from './components/TechStack.jsx';
import About from './components/About.jsx';
import Footer from './components/Footer.jsx';
import NetworkCanvas from './components/NetworkCanvas.jsx';
import { enrichGraph, mockGraph, mockSearch } from './data/samplePages.js';
import { fetchGraph, fetchSearch } from './services/api.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [graph, setGraph] = useState(() => enrichGraph(mockGraph()));
  const [results, setResults] = useState(() => mockSearch('machine learning').results);
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState(-1); // -1 idle, 0-3 running stages, 4 finished
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [focusId, setFocusId] = useState(null); // page hovered in the UI, highlighted in the background graph

  useEffect(() => { fetchGraph().then((g) => setGraph(enrichGraph(g))).catch(() => {}); }, []);
  // Scroll reveal: every block below the fold rises in with a 3D tilt the first time it enters the viewport.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sel = '.section > *:not(.rank-rows):not(.pr-grid):not(.explorer), .rank-rows > *, .pr-grid > *, .explorer > *, .footer';
    const els = [...document.querySelectorAll(sel)].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.95);
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((el) => { el.classList.add('rv'); el.style.setProperty('--rd', `${([...el.parentElement.children].indexOf(el) % 4) * 90}ms`); io.observe(el); });
    return () => io.disconnect();
  }, []);
  const matchIds = useMemo(() => (searched && phase === 4 ? results.map((r) => r.id) : []), [searched, phase, results]);

  async function runSearch(q) {
    if (!q.trim() || (phase >= 0 && phase < 4)) return;
    setQuery(q); setError(''); setSearched(true); setPhase(0);
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' });
    try {
      const request = fetchSearch(q); // the real request runs while the stages play
      for (let i = 0; i < 4; i++) { setPhase(i); await wait(550); }
      const data = await request;
      setResults(data.results); setPhase(4);
    } catch { setError('The search API could not be reached. Check that the backend is running.'); setPhase(-1); }
  }

  return (
    <>
      <div className="bg-canvas" aria-hidden="true"><NetworkCanvas graph={graph} selectedId={focusId} highlightIds={matchIds} /></div>
      <Navbar />
      <main>
        <Hero graph={graph} onSearch={runSearch} busy={phase >= 0 && phase < 4} />
        <SearchResults phase={phase} query={query} results={results} searched={searched} graph={graph} error={error} onFocusId={setFocusId} onSearch={runSearch} />
        <RankingVisualization results={results} graph={graph} onFocusId={setFocusId} />
        <GraphExplorer graph={graph} results={results} />
        <PageRankExplanation />
        <AlgorithmPipeline />
        <TechStack />
        <About />
      </main>
      <Footer graph={graph} />
    </>
  );
}
