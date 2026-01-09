import { useEffect, useMemo, useRef, useState } from "react";
import { formatDegree, parseRoot, type SpelledScale } from "../lib/music";
import type { ChordFocus } from "../lib/harmony";
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
  chordFocus,
  onClearChordFocus,
}: {
  spelled: SpelledScale;
  tuning: string[];
  onTuningChange: (index: number, value: string) => void;
  onResetTuning: () => void;
  chordFocus: ChordFocus | null;
  onClearChordFocus: () => void;
}) {
  const frets = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24 (no open string column)
  const formatNote = (note: string) => note.replace("b", "♭").replace("#", "♯");
  const tuningNotes = useMemo(
    () => tuning.map((note) => parseRoot(note)),
    [tuning],
  );
  const tuningSummary = useMemo(
    () => tuning.slice().reverse().map(formatNote).join(" "),
    [tuning],
  );
  const tuningDisplayIndices = useMemo(
    () => tuning.map((_, index) => index).reverse(),
    [tuning],
  );
  const fretboardDisplayIndices = useMemo(
    () => tuning.map((_, index) => index),
    [tuning],
  );
  const chordToneMap = useMemo(() => {
    if (!chordFocus) return null;
    return new Map(chordFocus.tones.map((tone) => [tone.pc, tone]));
  }, [chordFocus]);
  const [showTuningControls, setShowTuningControls] = useState(false);
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
          Full-width map. Scroll if needed. In-scale notes are shown; chord focus
          adds chord tones. Root is more saturated.
        </div>
        {chordFocus && (
          <div className="chordFocusBar">
            <div className="chordFocusText">
              Chord focus:{" "}
              <span className="chordFocusName">
                {chordFocus.label} ·{" "}
                {chordFocus.kind === "triad" ? "Triad" : "7ths"}
              </span>
            </div>
            <button
              type="button"
              className="chordFocusClear"
              onClick={onClearChordFocus}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="tuningSection">
        <div className="tuningHeader">
          <div className="tuningHeaderText">
            <div className="tuningTitle">Tuning</div>
            <div className="tuningSummaryText mono">
              {tuningSummary} · low → high
            </div>
          </div>
          <div className="tuningHeaderActions">
            <button
              type="button"
              className="tuningToggle"
              onClick={() => setShowTuningControls((prev) => !prev)}
            >
              {showTuningControls ? "Hide tuning" : "Edit tuning"}
            </button>
            {showTuningControls && (
              <div className="tuningResetGroup">
                <button type="button" className="tuningReset" onClick={handleReset}>
                  Reset to Standard
                </button>
                <span
                  className={["tuningToast", showToast ? "isVisible" : ""].join(
                    " ",
                  )}
                  role="status"
                  aria-live="polite"
                >
                  Tuning reset to standard.
                </span>
              </div>
            )}
          </div>
        </div>
        {showTuningControls && (
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
                    {isTop && (
                      <span className="tuningHint">· Top (low/heavy)</span>
                    )}
                    {isBottom && (
                      <span className="tuningHint">· Bottom (high/light)</span>
                    )}
                  </span>
                  <select
                    value={note}
                    onChange={(e) => onTuningChange(stringIndex, e.target.value)}
                  >
                    {TUNING_OPTIONS.map((option) => (
                      <option key={`${stringIndex}-${option}`} value={option}>
                        {formatNote(option)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        )}
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
            return (
              <div key={`${note.text}-${stringIndex}`} className="stringRow">
                <div className="stringLabel">
                  <span className="stringLabelRow">
                    <span className="stringNumber">S{stringNumber}</span>
                    <span className="stringNote">{note.text}</span>
                  </span>
                </div>

                {frets.map((fret) => {
                  const openPc = tuningNotes[stringIndex]?.pc ?? 0;
                  const pc = mod12(openPc + fret);
                  const degreeIndex = spelled.pcToDegreeIndex.get(pc);
                  const chordTone = chordToneMap?.get(pc);

                  if (degreeIndex === undefined) {
                    if (!chordTone) {
                      return <div key={fret} className="fretCell blank" />;
                    }
                    return (
                      <div
                        key={fret}
                        className={[
                          "fretCell",
                          "chordOnly",
                          "isChordTone",
                        ].join(" ")}
                        title={`${chordTone.text} (Chord ${chordTone.degree})`}
                      >
                        <div className="noteText">{chordTone.text}</div>
                        <div className="noteDegree mono chordDegree">
                          {chordTone.degree}
                        </div>
                      </div>
                    );
                  }

                  const degree = spelled.scale.degrees[degreeIndex];
                  const note = spelled.degrees[degreeIndex].note;
                  const isRoot = degreeIndex === 0;
                  const isChordTone = Boolean(chordTone);
                  const titleParts = [`${note.text} (${degree.number})`];
                  if (chordTone) titleParts.push(`Chord ${chordTone.degree}`);

                  return (
                    <div
                      key={fret}
                      className={[
                        "fretCell",
                        "note",
                        `degree-${degree.number}`,
                        isRoot ? "isRoot" : "",
                        isChordTone ? "isChordTone" : "",
                      ].join(" ")}
                      title={titleParts.join(" · ")}
                    >
                      <div className="noteText">{note.text}</div>
                      <div className="noteDegree mono">
                        {formatDegree(degree)}
                      </div>
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
