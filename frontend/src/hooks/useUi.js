import { useEffect, useRef, useState } from 'react';
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// True once the element has scrolled into view (fires once).
export function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Animates a number toward `target` (eased). Snaps instantly with reduced motion.
export function useCountUp(target, active = true, ms = 800) {
  const [value, setValue] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    if (!active) return;
    if (reducedMotion()) { current.current = target; setValue(target); return; }
    const from = current.current, t0 = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min((now - t0) / ms, 1);
      current.current = from + (target - from) * (1 - Math.pow(1 - p, 3));
      setValue(current.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return value;
}

// Soft 3D tilt toward the cursor. Spread the result on an element: <div {...tilt}>.
export function useTilt(max = 8) {
  const ref = useRef(null);
  const onPointerMove = (e) => {
    const el = ref.current;
    if (!el || reducedMotion() || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-y * max}deg) rotateY(${x * max}deg) translateZ(6px)`;
  };
  const onPointerLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return { ref, onPointerMove, onPointerLeave };
}
