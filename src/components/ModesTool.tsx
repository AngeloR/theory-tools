import { SCALES, formatDegree } from "../lib/music";

export type ModeOption = {
  id: string;
  label: string;
};

const formatNote = (note: string) => note.replace("b", "\u266d").replace("#", "\u266f");

export function ModesTool(props: {
  root: string;
  modeId: string;
  rootOptions: string[];
  modes: ModeOption[];
  onRootChange: (value: string) => void;
  onModeChange: (value: string) => void;
}) {
  const formattedRoot = formatNote(props.root);
  const selectedScale = SCALES.find((scale) => scale.id === props.modeId);
  const intervalText = selectedScale
    ? selectedScale.degrees.map((degree) => formatDegree(degree)).join(" ")
    : "—";
  return (
    <section className="panel modesPanel">
      <div className="panelHeader">
        <div className="panelTitle">Modes Explorer</div>
        <div className="panelSubtitle">
          Pick a root and a diatonic mode, then see it across the fretboard.
        </div>
      </div>

      <div className="controls">
        <label className="control">
          <span className="controlLabel">Root</span>
          <select
            value={props.root}
            onChange={(event) => props.onRootChange(event.target.value)}
          >
            {props.rootOptions.map((note) => (
              <option key={note} value={note}>
                {formatNote(note)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="modePicker">
        <div className="controlLabel">Mode</div>
        <div className="modeStrip" role="list" aria-label="Diatonic modes">
          {props.modes.map((mode) => {
            const isSelected = mode.id === props.modeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="listitem"
                className={["modePill", isSelected ? "isSelected" : ""].join(" ")}
                onClick={() => props.onModeChange(mode.id)}
                aria-pressed={isSelected}
              >
                <div className="modePillTop mono">{formattedRoot}</div>
                <div className="modePillMain">{mode.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="modeIntervals">
        <div className="controlLabel">Intervals</div>
        <div className="modeIntervalsText mono">{intervalText}</div>
      </div>
    </section>
  );
}
