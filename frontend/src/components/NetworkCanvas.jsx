import { useEffect, useRef } from 'react';
import { NetworkScene } from '../three/NetworkScene.js';

// React wrapper around the imperative Three.js scene. Rebuilds only when the graph changes.
export default function NetworkCanvas({ graph, selectedId = null, highlightIds = [], interactive = false, onSelect, onHover, apiRef }) {
  const host = useRef(null), scene = useRef(null), callbacks = useRef({});
  callbacks.current = { onSelect, onHover };
  const idsKey = highlightIds.join(',');

  useEffect(() => {
    const s = new NetworkScene(host.current, graph, {
      interactive, lowPower: window.innerWidth < 700,
      onSelect: (id) => callbacks.current.onSelect?.(id), onHover: (id) => callbacks.current.onHover?.(id),
    });
    scene.current = s;
    if (apiRef) apiRef.current = { zoom: (d) => s.zoom(d) };
    return () => { s.dispose(); scene.current = null; };
  }, [graph, interactive]); // eslint-disable-line

  useEffect(() => { scene.current?.setHighlight(selectedId, highlightIds); }, [graph, selectedId, idsKey]); // eslint-disable-line
  return <div className="canvas-host" ref={host} />;
}
