import { useMemo, useState } from 'react';
import { convergenceHistory } from '../data/samplePages.js';
const W = 640, H = 260, L = 50, R = 16, T = 16, B = 28;
const COLORS = ['#ffffff', '#8c8c96', '#ff9d42'];
const short = (t) => (t.length > 26 ? t.slice(0, 25) + '…' : t);

// Glowing line chart: PageRank of the top pages after each iteration. Hover to read exact values.
export default function ConvergenceChart({ graph, pages }) {
  const [hover, setHover] = useState(null);
  const key = pages.map((p) => p.id).join();
  const series = useMemo(() => convergenceHistory(graph, pages.map((p) => p.id)), [graph, key]); // eslint-disable-line
  if (!series.length) return null;
  const n = series[0].length, all = series.flat(), hi = Math.max(...all) * 1.08, lo = Math.min(...all) * 0.9;
  const x = (i) => L + (i / (n - 1)) * (W - L - R), y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  // smooth curve: cubic segments with horizontal handles
  const path = (s) => s.map((v, i) => (i === 0 ? `M${x(0)} ${y(v)}` : `C${(x(i - 1) + x(i)) / 2} ${y(s[i - 1])} ${(x(i - 1) + x(i)) / 2} ${y(v)} ${x(i)} ${y(v)}`)).join(' ');
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };
  const bw = 214, bh = 22 + series.length * 16, bx = hover != null && x(hover) > W / 2 ? x(hover) - bw - 10 : hover != null ? x(hover) + 10 : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="PageRank of the top pages over iterations">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".35" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
      </defs>
      {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.15)" /><text x={L - 8} y={y(v) + 3} className="ax" textAnchor="end">{v.toFixed(3)}</text></g>)}
      {[0, Math.round((n - 1) / 2), n - 1].map((i) => <text key={i} x={x(i)} y={H - 8} className="ax" textAnchor="middle">{i}</text>)}
      <path d={`${path(series[0])} L${x(n - 1)} ${H - B} L${x(0)} ${H - B} Z`} fill="url(#area)" />
      {series.map((s, k) => <path key={pages[k].id} d={path(s)} fill="none" stroke={COLORS[k % 3]} strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" pathLength="1" className="line" />)}
      {hover != null && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgba(255,255,255,.4)" strokeDasharray="3 3" />
          {series.map((s, k) => <circle key={k} cx={x(hover)} cy={y(s[hover])} r="4.5" fill="#050815" stroke={COLORS[k % 3]} strokeWidth="2" />)}
          <rect x={bx} y={T + 4} width={bw} height={bh} rx="8" fill="rgba(21,21,21,.92)" stroke="rgba(255,255,255,.4)" />
          <text x={bx + 10} y={T + 20} className="tt" fontWeight="600">Iteration {hover}</text>
          {series.map((s, k) => <text key={k} x={bx + 10} y={T + 36 + k * 16} className="tt" fill={COLORS[k % 3]}>{short(pages[k].title)}: {s[hover].toFixed(3)}</text>)}
        </g>
      )}
    </svg>
  );
}
