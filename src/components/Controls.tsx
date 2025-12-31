import type { ScaleDef } from "../lib/music";

export function Controls(props: {
  roots: string[];
  scales: ScaleDef[];
  root: string;
  scaleId: string;
  onRootChange: (v: string) => void;
  onScaleChange: (v: string) => void;
}) {
  return (
    <div className="controls">
      <label className="control">
        <span className="controlLabel">Root</span>
        <select
          value={props.root}
          onChange={(e) => props.onRootChange(e.target.value)}
        >
          {props.roots.map((r) => (
            <option key={r} value={r}>
              {r.replace("b", "♭").replace("#", "♯")}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span className="controlLabel">Scale</span>
        <select
          value={props.scaleId}
          onChange={(e) => props.onScaleChange(e.target.value)}
        >
          {props.scales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
