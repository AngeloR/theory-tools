import { formatDegree, type SpelledScale } from "../lib/music";

export function DegreeMap({ spelled }: { spelled: SpelledScale }) {
  const formula = spelled.scale.degrees.map(formatDegree).join("  ");

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Degree Map</div>
        <div className="panelSubtitle">
          Formula: <span className="mono">{formula}</span>
        </div>
      </div>

      <div className="degreeGrid">
        <div className="degreeGridHeader">Degree</div>
        <div className="degreeGridHeader">Note</div>

        {spelled.degrees.map((d, idx) => {
          const isRoot = idx === 0; // degree 1 in these scales
          return (
            <div key={`${d.note.text}-${idx}`} className="degreeRow">
              <div
                className={`degreeCell degreeTag degree-${d.degree.number} ${
                  isRoot ? "isRoot" : ""
                }`}
              >
                {formatDegree(d.degree)}
              </div>
              <div className="degreeCell noteCell">{d.note.text}</div>
            </div>
          );
        })}
      </div>

      <div className="teacherHint">
        Teacher hint: call the degrees out loud (“♭3”, “6”, “7”) as fast as you
        name the notes.
      </div>
    </section>
  );
}
