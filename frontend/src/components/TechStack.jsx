import { useTilt } from '../hooks/useUi.js';
const TECH = [
  ['Python', 'Backend language'], ['Flask / FastAPI', 'Serves /api/search and /api/graph'], ['PageRank', 'Authority from hyperlinks'],
  ['NetworkX', 'Graph structure and PageRank'], ['NumPy', 'Matrix and vector maths'], ['Scikit-learn', 'Text relevance scoring'],
  ['Three.js', '3D graph rendering'], ['JavaScript', 'Interaction logic'], ['HTML', 'Page structure'], ['CSS', 'Layout and styling'],
];
// Outer wrapper floats (CSS animation); inner card tilts toward the cursor. Kept separate so the two transforms don't fight.
function Card({ name, role, i }) { const tilt = useTilt(10); return <div className="float" style={{ '--i': i }}><div {...tilt} className="card tech"><b>{name}</b><span>{role}</span></div></div>; }
export default function TechStack() {
  return <section className="section"><h2>TECHNOLOGY</h2><div className="tech-grid">{TECH.map(([n, r], i) => <Card key={n} name={n} role={r} i={i} />)}</div></section>;
}
