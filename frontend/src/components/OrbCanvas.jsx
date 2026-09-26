import { useEffect, useRef } from 'react';
import { OrbScene } from '../three/OrbScene.js';
// React wrapper for the hero orb; rebuilds only if the graph object changes.
export default function OrbCanvas({ graph }) {
  const host = useRef(null);
  useEffect(() => { const s = new OrbScene(host.current, graph, { lowPower: window.innerWidth < 700 }); return () => s.dispose(); }, [graph]);
  return <div className="canvas-host" ref={host} />;
}
