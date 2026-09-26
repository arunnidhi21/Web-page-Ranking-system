// 3D podium: each page is a stack of discs whose height is its final score. The stack is drawn as
// flat slices at increasing translateZ inside a tilted, slowly yawing plane (no WebGL needed).
const SLICES = 30, STEP = 4;
export default function Podium({ top }) {
  return (
    <div className="podium-wrap" aria-hidden="true">
      <div className="podium">
        {top.map((r, i) => {
          const n = Math.max(2, Math.round(r.final * SLICES));
          return (
            <div className="col" key={r.id} style={{ left: i * 130 }}>
              {Array.from({ length: n }, (_, k) => <i key={k} className={k === n - 1 ? 'top' : ''} style={{ transform: `translateZ(${k * STEP}px)`, '--k': k }} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
