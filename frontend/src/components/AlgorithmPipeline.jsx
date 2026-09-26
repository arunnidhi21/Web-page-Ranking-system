import { useInView } from '../hooks/useUi.js';
const STAGES = [
  ['User query', 'The text typed into the search bar'], ['Query processing', 'Split into lowercase terms'],
  ['Text relevance', 'Score each page against the terms'], ['Hyperlink graph', 'Pages are nodes, links are edges'],
  ['PageRank', 'Authority from incoming links'], ['Ranking engine', 'Combine relevance and PageRank'], ['Search results', 'Ordered list sent to the interface'],
];
const CYCLE = 9; // seconds for the packet to cross the belt (must match --cycle in CSS)
const layers = (n) => Array.from({ length: n }, (_, k) => k);
// A "wall" is a stack of flat slices at increasing translateZ, which gives an extruded block in the isometric scene.
const Wall = ({ y }) => <div className="wall" style={{ top: y }}>{layers(10).map((k) => <i key={k} className={k === 9 ? 'cap' : ''} style={{ transform: `translateZ(${k * 3}px)` }} />)}</div>;

export default function AlgorithmPipeline() {
  const [ref, inView] = useInView(0.2);
  return (
    <section className="section" ref={ref} aria-label="Algorithm pipeline">
      <h2>ALGORITHM PIPELINE</h2>
      <p className="muted">A query travels down the line. Each station lights up as the packet passes through it.</p>
      <div className="iso-wrap" aria-hidden="true">
        <div className="iso">
          <div className="belt" />
          {STAGES.map((s, i) => (
            // Delay each station's glow so it peaks when the packet reaches it (packet crosses 864px in CYCLE seconds).
            <div className="station" key={s[0]} style={{ left: 30 + i * 130, '--d': `${Math.max(0, ((44 + i * 130) / 864) * CYCLE - 0.4).toFixed(2)}s` }}>
              <div className="pad"><span>{i + 1}</span></div><Wall y={2} /><Wall y={94} />
            </div>
          ))}
          <div className="packet">{layers(8).map((k) => <i key={k} style={{ transform: `translateZ(${k * 3 + 2}px)` }} />)}</div>
        </div>
      </div>
      <ol className={`pipeline ${inView ? 'on' : ''}`}>
        {STAGES.map(([name, text], i) => <li key={name} style={{ '--i': i }}><b>{i + 1}. {name}</b><span>{text}</span></li>)}
      </ol>
    </section>
  );
}
