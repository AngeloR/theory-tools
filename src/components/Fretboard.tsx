import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

type ChordDegree = "1" | "3" | "5" | "7";
export type CagedShapeId = "C" | "A" | "G" | "E" | "D";

type CagedShape = {
  id: CagedShapeId;
  rootString: number;
  rootOffset: number;
  triadDegrees: Array<ChordDegree | null>;
  triadOffsets: Array<number | null>;
  seventhDegrees: Array<ChordDegree | null>;
  seventhOffsets: Array<number | null>;
};

type CagedPosition = {
  id: CagedShapeId;
  baseFret: number;
  maxFret: number;
  frets: Array<number | null>;
  degrees: Array<ChordDegree | null>;
};

type ChordToneInfo = {
  pc: number;
  text: string;
  degree: ChordDegree;
};

type CagedCandidate = {
  fret: number | null;
  degree: ChordDegree | null;
  cost: number;
};

const MAX_FRET = 24;
const CAGED_SPAN = 4;

const toHighOrder = <T,>(values: T[]) => values.slice().reverse();

const CAGED_SHAPES: CagedShape[] = [
  {
    id: "C",
    rootString: 4,
    rootOffset: 3,
    triadDegrees: toHighOrder([null, "1", "3", "5", "1", "3"]),
    triadOffsets: toHighOrder([null, 3, 2, 0, 1, 0]),
    seventhDegrees: toHighOrder([null, "1", "3", "7", "1", "3"]),
    seventhOffsets: toHighOrder([null, 3, 2, 3, 1, 0]),
  },
  {
    id: "A",
    rootString: 4,
    rootOffset: 0,
    triadDegrees: toHighOrder([null, "1", "5", "1", "3", "5"]),
    triadOffsets: toHighOrder([null, 0, 2, 2, 2, 0]),
    seventhDegrees: toHighOrder([null, "1", "5", "7", "3", "5"]),
    seventhOffsets: toHighOrder([null, 0, 2, 0, 2, 0]),
  },
  {
    id: "G",
    rootString: 5,
    rootOffset: 3,
    triadDegrees: toHighOrder(["1", "3", "5", "1", "3", "1"]),
    triadOffsets: toHighOrder([3, 2, 0, 0, 0, 3]),
    seventhDegrees: toHighOrder(["1", "3", "5", "1", "3", "7"]),
    seventhOffsets: toHighOrder([3, 2, 0, 0, 0, 1]),
  },
  {
    id: "E",
    rootString: 5,
    rootOffset: 0,
    triadDegrees: toHighOrder(["1", "5", "1", "3", "5", "1"]),
    triadOffsets: toHighOrder([0, 2, 2, 1, 0, 0]),
    seventhDegrees: toHighOrder(["1", "5", "7", "3", "5", "1"]),
    seventhOffsets: toHighOrder([0, 2, 0, 1, 0, 0]),
  },
  {
    id: "D",
    rootString: 3,
    rootOffset: 0,
    triadDegrees: toHighOrder([null, null, "1", "5", "1", "3"]),
    triadOffsets: toHighOrder([null, null, 0, 2, 3, 2]),
    seventhDegrees: toHighOrder([null, null, "1", "5", "7", "3"]),
    seventhOffsets: toHighOrder([null, null, 0, 2, 1, 2]),
  },
];

function mod12(n: number) {
  return ((n % 12) + 12) % 12;
}

function findFretsForPc(
  openPc: number,
  targetPc: number,
  minFret: number,
  maxFret: number,
) {
  const frets: number[] = [];
  for (let fret = minFret; fret <= maxFret; fret += 1) {
    if (mod12(openPc + fret) === targetPc) frets.push(fret);
  }
  return frets;
}

function chooseCagedVoicing(
  tuningNotes: Array<{ pc: number }>,
  chordTones: ChordToneInfo[],
  requiredDegrees: ChordDegree[],
  baseFret: number,
  maxFret: number,
  shape: CagedShape,
  rootFret: number,
  kind: "triad" | "7th",
) {
  const degrees = kind === "triad" ? shape.triadDegrees : shape.seventhDegrees;
  const offsets = kind === "triad" ? shape.triadOffsets : shape.seventhOffsets;
  const candidatesByString: CagedCandidate[][] = [];

  for (let stringIndex = 0; stringIndex < tuningNotes.length; stringIndex += 1) {
    if (stringIndex === shape.rootString) {
      candidatesByString.push([{ fret: rootFret, degree: "1", cost: 0 }]);
      continue;
    }

    const preferredDegree = degrees[stringIndex];
    const targetOffset = offsets[stringIndex];
    const targetFret = targetOffset === null ? null : baseFret + targetOffset;
    const openPc = tuningNotes[stringIndex]?.pc ?? 0;
    const candidates: CagedCandidate[] = [];

    for (let fret = baseFret; fret <= maxFret; fret += 1) {
      const pc = mod12(openPc + fret);
      chordTones.forEach((tone) => {
        if (tone.pc !== pc) return;
        const distanceCost = targetFret === null ? 0 : Math.abs(fret - targetFret);
        const degreeCost =
          preferredDegree && tone.degree !== preferredDegree ? 2 : 0;
        const mutePenalty = preferredDegree ? 0 : 1;
        candidates.push({
          fret,
          degree: tone.degree,
          cost: distanceCost + degreeCost + mutePenalty,
        });
      });
    }

    const muteCost = preferredDegree ? 2 : 0;
    candidates.push({ fret: null, degree: null, cost: muteCost });
    candidatesByString.push(candidates);
  }

  const best = {
    score: Number.POSITIVE_INFINITY,
    frets: [] as Array<number | null>,
    degrees: [] as Array<ChordDegree | null>,
  };
  const counts: Record<ChordDegree, number> = { "1": 0, "3": 0, "5": 0, "7": 0 };
  const frets = new Array<number | null>(tuningNotes.length).fill(null);
  const degreeAssignments = new Array<ChordDegree | null>(tuningNotes.length).fill(null);

  const search = (index: number, score: number) => {
    if (score >= best.score) return;
    if (index === candidatesByString.length) {
      const missing = requiredDegrees.filter((d) => counts[d] === 0);
      if (missing.length > 0) return;

      let duplicatePenalty = 0;
      requiredDegrees.forEach((d) => {
        const extra = counts[d] - 1;
        if (extra > 0) duplicatePenalty += extra;
      });
      const total = score + duplicatePenalty;
      if (total < best.score) {
        best.score = total;
        best.frets = [...frets];
        best.degrees = [...degreeAssignments];
      }
      return;
    }

    candidatesByString[index].forEach((candidate) => {
      frets[index] = candidate.fret;
      degreeAssignments[index] = candidate.degree;
      if (candidate.degree) counts[candidate.degree] += 1;
      search(index + 1, score + candidate.cost);
      if (candidate.degree) counts[candidate.degree] -= 1;
    });
  };

  search(0, 0);
  if (!best.frets.length) return null;

  return {
    frets: best.frets,
    degrees: best.degrees,
    score: best.score,
  };
}

function buildCagedPositions(
  tuningNotes: Array<{ pc: number }>,
  degreeMap: Map<ChordDegree, ChordToneInfo>,
  kind: "triad" | "7th",
): CagedPosition[] {
  const rootTone = degreeMap.get("1");
  if (!rootTone) return [];
  const chordTones = Array.from(degreeMap.values());
  const requiredDegrees: ChordDegree[] =
    kind === "triad" ? ["1", "3", "5"] : ["1", "3", "5", "7"];

  return CAGED_SHAPES.flatMap((shape) => {
    const rootOpenPc = tuningNotes[shape.rootString]?.pc ?? 0;
    const minRootFret = shape.rootOffset + 1;
    const maxRootFret = MAX_FRET - (CAGED_SPAN - 1) + shape.rootOffset;
    const rootFrets = findFretsForPc(rootOpenPc, rootTone.pc, minRootFret, maxRootFret);
    if (rootFrets.length === 0) return [];

    let bestPosition: (CagedPosition & { score: number }) | null = null;

    for (const rootFret of rootFrets) {
      const baseFret = rootFret - shape.rootOffset;
      const maxFret = baseFret + CAGED_SPAN - 1;
      if (baseFret < 1 || maxFret > MAX_FRET) continue;

      const voicing = chooseCagedVoicing(
        tuningNotes,
        chordTones,
        requiredDegrees,
        baseFret,
        maxFret,
        shape,
        rootFret,
        kind,
      );
      if (!voicing) continue;

      const position: CagedPosition & { score: number } = {
        id: shape.id,
        baseFret,
        maxFret,
        frets: voicing.frets,
        degrees: voicing.degrees,
        score: voicing.score,
      };

      if (!bestPosition || position.score < bestPosition.score) {
        bestPosition = position;
      }
    }

    if (!bestPosition) return [];
    return [
      {
        id: bestPosition.id,
        baseFret: bestPosition.baseFret,
        maxFret: bestPosition.maxFret,
        frets: bestPosition.frets,
        degrees: bestPosition.degrees,
      },
    ];
  });
}

export function Fretboard({
  spelled,
  tuning,
  onTuningChange,
  onResetTuning,
  chordFocus,
  onClearChordFocus,
  onSnapshot,
  readOnly = false,
  panelTitle = "Fretboard",
  panelSubtitle,
  headerActions,
  initialCagedId,
}: {
  spelled: SpelledScale;
  tuning: string[];
  onTuningChange: (index: number, value: string) => void;
  onResetTuning: () => void;
  chordFocus: ChordFocus | null;
  onClearChordFocus: () => void;
  onSnapshot?: (activeCagedId: CagedShapeId | null) => void;
  readOnly?: boolean;
  panelTitle?: string;
  panelSubtitle?: string | null;
  headerActions?: ReactNode;
  initialCagedId?: CagedShapeId | null;
}) {
  const frets = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24 (no open string column)
  const formatNote = (note: string) => note.replace("b", "♭").replace("#", "♯");
  const tuningNotes = useMemo(
    () => tuning.map((note) => parseRoot(note)),
    [tuning],
  );
  const fretboardDisplayIndices = useMemo(
    () => tuning.map((_, index) => index),
    [tuning],
  );
  const chordDegreeMap = useMemo(() => {
    if (!chordFocus) return null;
    return new Map(chordFocus.tones.map((tone) => [tone.degree, tone]));
  }, [chordFocus]);
  const cagedPositions = useMemo(() => {
    if (!chordFocus || !chordDegreeMap) return [];
    return buildCagedPositions(tuningNotes, chordDegreeMap, chordFocus.kind);
  }, [chordDegreeMap, chordFocus, tuningNotes]);
  const [activeCagedId, setActiveCagedId] = useState<CagedShapeId | null>(
    initialCagedId ?? null,
  );
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chordFocus) {
      if (activeCagedId !== null) setActiveCagedId(null);
      return;
    }
    if (!cagedPositions.length) {
      if (activeCagedId !== null) setActiveCagedId(null);
      return;
    }
    const hasActive = cagedPositions.some((pos) => pos.id === activeCagedId);
    if (!hasActive) {
      setActiveCagedId(cagedPositions[0]?.id ?? null);
    }
  }, [activeCagedId, cagedPositions, chordFocus]);

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

  const activeCaged = useMemo(
    () => cagedPositions.find((pos) => pos.id === activeCagedId) ?? null,
    [activeCagedId, cagedPositions],
  );
  const activeChordPositions = useMemo(() => {
    if (!activeCaged || !chordDegreeMap) return null;
    const map = new Map<string, { text: string; degree: ChordDegree }>();
    activeCaged.frets.forEach((fret, stringIndex) => {
      if (fret === null) return;
      const degree = activeCaged.degrees[stringIndex];
      if (!degree) return;
      const tone = chordDegreeMap.get(degree);
      if (!tone) return;
      map.set(`${stringIndex}-${fret}`, { text: tone.text, degree });
    });
    return map;
  }, [activeCaged, chordDegreeMap]);
  const hasChordFocus = Boolean(chordFocus && activeChordPositions);
  const subtitleText =
    panelSubtitle === undefined
      ? readOnly
        ? "Snapshot of the current fretboard view."
        : "Full-width map. Scroll if needed. In-scale notes are shown; chord focus uses CAGED voicings. Root is more saturated. Click a string label to retune it."
      : panelSubtitle;
  const headerActionsNode =
    headerActions ??
    (!readOnly && onSnapshot ? (
      <button
        type="button"
        className="snapshotButton"
        onClick={() => onSnapshot(activeCagedId)}
      >
        Take snapshot
      </button>
    ) : null);

  return (
    <section className="panel fretboardPanel">
      <div className="panelHeader">
        <div className="panelHeaderRow">
          <div className="panelTitle">{panelTitle}</div>
          {headerActionsNode && (
            <div className="panelHeaderActions">{headerActionsNode}</div>
          )}
        </div>
        {subtitleText !== null && <div className="panelSubtitle">{subtitleText}</div>}
        {chordFocus && (
          <div className="chordFocusBar">
            <div className="chordFocusText">
              Chord focus:{" "}
              <span className="chordFocusName">
                {chordFocus.label} ·{" "}
                {chordFocus.kind === "triad" ? "Triad" : "7ths"}
              </span>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="chordFocusClear"
                onClick={onClearChordFocus}
              >
                Clear
              </button>
            )}
          </div>
        )}
        {chordFocus && cagedPositions.length > 0 && (
          <div className="cagedSection">
            <div className="cagedHeader">
              <div className="cagedTitle">CAGED positions</div>
              <div className="cagedSubtitle">
                Choose a shape to see a playable voicing.
              </div>
            </div>
            <div className="cagedRow">
              {cagedPositions.map((pos) => {
                const isActive = pos.id === activeCagedId;
                const fretsText = pos.frets
                  .slice()
                  .reverse()
                  .map((fret) => (fret === null ? "x" : fret))
                  .join(" ");
                return (
                  <button
                    key={pos.id}
                    type="button"
                    className={[
                      "cagedButton",
                      isActive ? "isSelected" : "",
                    ].join(" ")}
                    onClick={() => {
                      if (readOnly) return;
                      setActiveCagedId(pos.id);
                    }}
                    aria-pressed={isActive}
                    aria-disabled={readOnly}
                    disabled={readOnly}
                  >
                    <span className="cagedShape">{pos.id}</span>
                    <span className="cagedRange">
                      frets {pos.baseFret}–{pos.maxFret}
                    </span>
                    <span className="cagedFrets mono">{fretsText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="fretboardScroll">
        <div className={["fretboard", hasChordFocus ? "hasChordFocus" : ""].join(" ")}>
          {/* Fret numbers row */}
          <div className="fretHeader">
            <div className="stringLabelSpacer" />
            {frets.map((f) => (
              <div key={f} className="fretNumber">
                {INLAY_FRETS.has(f) && (
                  <span className="inlayMark">
                    {DOUBLE_INLAY_FRETS.has(f) ? "●●" : "●"}
                  </span>
                )}
                <span className="fretNumberValue">{f}</span>
              </div>
            ))}
          </div>

          {/* Strings */}
          {fretboardDisplayIndices.map((stringIndex) => {
            const note = tuningNotes[stringIndex];
            const stringNumber = tuningNotes.length - stringIndex;
            return (
              <div key={`${note.text}-${stringIndex}`} className="stringRow">
                <div className="stringLabel">
                  <label className="stringLabelRow">
                    <select
                      className="stringTuningSelect"
                      value={tuning[stringIndex]}
                      onChange={
                        readOnly
                          ? undefined
                          : (e) => onTuningChange(stringIndex, e.target.value)
                      }
                      aria-label={`String ${stringNumber} tuning`}
                      disabled={readOnly}
                    >
                      {TUNING_OPTIONS.map((option) => (
                        <option key={`${stringIndex}-${option}`} value={option}>
                          {formatNote(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {frets.map((fret) => {
                  const openPc = tuningNotes[stringIndex]?.pc ?? 0;
                  const pc = mod12(openPc + fret);
                  const degreeIndex = spelled.pcToDegreeIndex.get(pc);
                  const chordTone = activeChordPositions?.get(
                    `${stringIndex}-${fret}`,
                  );

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
      {!readOnly && (
        <div className="fretboardFooter">
          <div className="fretboardFooterSpacer" />
          <div className="fretboardActions">
            {onSnapshot && (
              <button
                type="button"
                className="snapshotButton"
                onClick={() => onSnapshot(activeCagedId)}
              >
                Take snapshot
              </button>
            )}
            <button type="button" className="tuningReset" onClick={handleReset}>
              Reset tuning
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
      )}
    </section>
  );
}
