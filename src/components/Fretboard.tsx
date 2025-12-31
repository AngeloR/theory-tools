import { type SpelledScale } from "../lib/music";
import { INLAY_FRETS, DOUBLE_INLAY_FRETS, pitchClassAt } from "../lib/guitar";

const STRINGS = ["E", "B", "G", "D", "A", "E"]; // High -> Low for labels

export function Fretboard({ spelled }: { spelled: SpelledScale }) {
  const frets = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24 (no open string column)

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Fretboard</div>
        <div className="panelSubtitle">
          Scroll horizontally. Only in-scale notes are shown. Root is more
          saturated.
        </div>
      </div>

      <div className="fretboardScroll">
        <div className="fretboard">
          {/* Fret numbers row */}
          <div className="fretHeader">
            <div className="stringLabelSpacer" />
            {frets.map((f) => (
              <div key={f} className="fretNumber">
                {f}
                {INLAY_FRETS.has(f) && (
                  <span className="inlayMark">
                    {DOUBLE_INLAY_FRETS.has(f) ? "●●" : "●"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Strings */}
          {STRINGS.map((sName, stringIndex) => (
            <div key={sName + stringIndex} className="stringRow">
              <div className="stringLabel">{sName}</div>

              {frets.map((fret) => {
                const pc = pitchClassAt(stringIndex, fret);
                const degreeIndex = spelled.pcToDegreeIndex.get(pc);

                if (degreeIndex === undefined) {
                  return <div key={fret} className="fretCell blank" />;
                }

                const degree = spelled.scale.degrees[degreeIndex];
                const note = spelled.degrees[degreeIndex].note;
                const isRoot = degreeIndex === 0;

                return (
                  <div
                    key={fret}
                    className={[
                      "fretCell",
                      "note",
                      `degree-${degree.number}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                    title={`${note.text} (${degree.number})`}
                  >
                    <div className="noteText">{note.text}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
