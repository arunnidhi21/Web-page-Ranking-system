import { useInView } from '../hooks/useUi.js';
const ROWS = [['Project', 'Web Search Ranking System'], ['Core algorithm', 'PageRank'], ['Core concept', 'Ranking web pages based on hyperlink relationships'], ['Search method', 'Text relevance + PageRank'], ['Visualization', 'Interactive 3D graph']];
export default function About() {
  const [ref, inView] = useInView();
  return (
    <section id="about" className="section" ref={ref}>
      <h2>ABOUT PROJECT</h2>
      <dl className={`about ${inView ? 'on' : ''}`}>{ROWS.map(([k, v], i) => <div key={k} style={{ '--i': i }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </section>
  );
}
