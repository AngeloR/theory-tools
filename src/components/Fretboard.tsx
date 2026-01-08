import { useEffect, useMemo, useRef, useState } from "react";
import { formatDegree, parseRoot, type SpelledScale } from "../lib/music";
import { INLAY_FRETS, DOUBLE_INLAY_FRETS } from "../lib/guitar";

const TUNING_OPTIONS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "Fb",
  "E#",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
  "Cb",
  "B#",
];

function mod12(n: number) {
  return ((n % 12) + 12) % 12;
}

export function Fretboard({
  spelled,
  tuning,
  onTuningChange,
  onResetTuning,
}: {
  spelled: SpelledScale;
  tuning: string[];
  onTuningChange: (index: number, value: string) => void;
  onResetTuning: () => void;
}) {
  const frets = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24 (no open string column)
  const tuningNotes = useMemo(() => tuning.map((note) => parseRoot(note)), [tuning]);
  const tuningDisplayIndices = useMemo(() => tuning.map((_, index) => index).reverse(), [tuning]);
  const fretboardDisplayIndices = useMemo(() => tuning.map((_, index) => index), [tuning]);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const handleReset = () => {
    onResetTuning();
    setShowToast(true);
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setShowToast(false);
    }, 1600);
  };

  return (
    <section className="panel fretboardPanel">
      <div className="panelHeader">
        <div className="panelTitle">Fretboard</div>
        <div className="panelSubtitle">
          Full-width map. Scroll if needed. Only in-scale notes are shown. Root is
          more saturated.
        </div>
      </div>

      <div className="tuningSection">
        <div className="tuningHeader">
          <div className="tuningTitle">Tuning (string 1 low → string 6 high)</div>
          <div className="tuningHeaderActions">
            <button type="button" className="tuningReset" onClick={handleReset}>
              Reset to Standard
            </button>
            <span
              className={["tuningToast", showToast ? "isVisible" : ""].join(" ")}
              role="status"
              aria-live="polite"
            >
              Tuning reset to standard.
            </span>
          </div>
        </div>
        <div className="tuningControls">
          {tuningDisplayIndices.map((stringIndex, position) => {
            const note = tuning[stringIndex];
            const stringNumber = tuning.length - stringIndex;
            const isTop = position === 0;
            const isBottom = position === tuningDisplayIndices.length - 1;
            return (
              <label key={`tuning-${stringIndex}`} className="tuningControl">
                <span className="tuningLabel">
                  String {stringNumber}
                  {isTop && <span className="tuningHint">Top · low/heavy</span>}
                  {isBottom && <span className="tuningHint">Bottom · high/light</span>}
                </span>
                <select
                  value={note}
                  onChange={(e) => onTuningChange(stringIndex, e.target.value)}
                >
                  {TUNING_OPTIONS.map((option) => (
                    <option key={`${stringIndex}-${option}`} value={option}>
                      {option.replace("b", "♭").replace("#", "♯")}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
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
          {fretboardDisplayIndices.map((stringIndex, position) => {
            const note = tuningNotes[stringIndex];
            const stringNumber = tuningNotes.length - stringIndex;
            const isTop = position === 0;
            const isBottom = position === fretboardDisplayIndices.length - 1;
            return (
              <div key={`${note.text}-${stringIndex}`} className="stringRow">
                <div className="stringLabel">
                  <span className="stringNumber">S{stringNumber}</span>
                  {note.text}
                  {isTop && <span className="stringHint">High/Light</span>}
                  {isBottom && <span className="stringHint">Low/Heavy</span>}
                </div>

                {frets.map((fret) => {
                  const openPc = tuningNotes[stringIndex]?.pc ?? 0;
                  const pc = mod12(openPc + fret);
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
                    <div className="noteDegree mono">{formatDegree(degree)}</div>
                  </div>
                );
              })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
