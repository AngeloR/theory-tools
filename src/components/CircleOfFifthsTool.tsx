import { useEffect, useMemo, useState } from "react";
import { SCALES, spellScale } from "../lib/music";
import {
  buildDiatonicChords,
  isDiatonic7Unique,
  modesForMajorKeySignature,
  type DiatonicChord,
} from "../lib/harmony";

type CoFKey = {
  id: string; // root text usable by parseRoot/spellScale
  label: string; // display
};

const CIRCLE_KEYS: CoFKey[] = [
  { id: "C", label: "C" },
  { id: "G", label: "G" },
  { id: "D", label: "D" },
  { id: "A", label: "A" },
  { id: "E", label: "E" },
  { id: "B", label: "B" },
  { id: "F#", label: "F♯" },
  { id: "Db", label: "D♭" },
  { id: "Ab", label: "A♭" },
  { id: "Eb", label: "E♭" },
  { id: "Bb", label: "B♭" },
  { id: "F", label: "F" },
];

const COF_STORAGE_KEY = "guitar-cof-key";

type QualityCategory =
  | "major"
  | "minor"
  | "dominant"
  | "diminished"
  | "half-diminished"
  | "augmented";

const QUALITY_LABELS: Record<DiatonicChord["quality"], string> = {
  maj: "maj",
  min: "min",
  dim: "dim",
  aug: "aug",
  maj7: "maj7",
  "7": "dom7",
  m7: "m7",
  m7b5: "m7b5",
  dim7: "dim7",
  mMaj7: "mMaj7",
  augMaj7: "augMaj7",
  aug7: "aug7",
};

const QUALITY_CATEGORY: Record<DiatonicChord["quality"], QualityCategory> = {
  maj: "major",
  min: "minor",
  dim: "diminished",
  aug: "augmented",
  maj7: "major",
  "7": "dominant",
  m7: "minor",
  m7b5: "half-diminished",
  dim7: "diminished",
  mMaj7: "minor",
  augMaj7: "augmented",
  aug7: "augmented",
};

const QUALITY_ORDER: DiatonicChord["quality"][] = [
  "maj",
  "min",
  "dim",
  "aug",
  "maj7",
  "7",
  "m7",
  "m7b5",
  "dim7",
  "mMaj7",
  "augMaj7",
  "aug7",
];

const CIRCLE_KEY_IDS = new Set(CIRCLE_KEYS.map((k) => k.id));

const ENHARMONIC_TO_CIRCLE: Record<string, string> = {
  "E#": "F",
  "B#": "C",
  Cb: "B",
  Fb: "E",
  Gb: "F#",
  "C#": "Db",
  "G#": "Ab",
  "D#": "Eb",
  "A#": "Bb",
};

function normalizeNoteId(text: string) {
  return text.replace("♭", "b").replace("♯", "#");
}

function circleIdForNote(text: string) {
  const normalized = normalizeNoteId(text);
  const mapped = ENHARMONIC_TO_CIRCLE[normalized] ?? normalized;
  return CIRCLE_KEY_IDS.has(mapped) ? mapped : undefined;
}

function posForIndex(i: number, count: number, radius: number) {
  // Start at 12 o'clock and go clockwise
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  return { x, y };
}

export function CircleOfFifthsTool() {
  const [selectedKey, setSelectedKey] = useState<string>(() => {
    if (typeof window === "undefined") return "C";
    const stored = window.localStorage.getItem(COF_STORAGE_KEY) ?? "C";
    return CIRCLE_KEY_IDS.has(stored) ? stored : "C";
  });
  const major = useMemo(() => SCALES.find((s) => s.id === "major") ?? SCALES[0], []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COF_STORAGE_KEY, selectedKey);
  }, [selectedKey]);

  const spelledMajor = useMemo(() => spellScale(selectedKey, major), [selectedKey, major]);
  const showDiatonic = isDiatonic7Unique(spelledMajor);
  const triads = showDiatonic ? buildDiatonicChords(spelledMajor, "triad") : [];
  const sevenths = showDiatonic ? buildDiatonicChords(spelledMajor, "7th") : [];
  const modes = showDiatonic ? modesForMajorKeySignature(spelledMajor) : [];

  const qualityLegend = useMemo(() => {
    const used = new Set([...triads, ...sevenths].map((c) => c.quality));
    return QUALITY_ORDER.filter((q) => used.has(q));
  }, [triads, sevenths]);

  const chordByCircleKey = useMemo(() => {
    const map = new Map<
      string,
      {
        chordText: string;
        roman?: string;
        degreeNumber: number;
        isRoot: boolean;
      }
    >();

    triads.forEach((chord) => {
      const rootNote = spelledMajor.degrees[chord.degreeIndex]?.note.text;
      const degreeNumber = spelledMajor.scale.degrees[chord.degreeIndex]?.number ?? chord.degreeIndex + 1;
      if (!rootNote) return;

      const circleId = circleIdForNote(rootNote);
      if (!circleId) return;

      map.set(circleId, {
        chordText: chord.chordText,
        roman: chord.roman,
        degreeNumber,
        isRoot: chord.degreeIndex === 0,
      });
    });

    return map;
  }, [spelledMajor, triads]);

  return (
    <section className="panel cofPanel">
      <div className="panelHeader">
        <div className="panelTitle">Circle of Fifths</div>
        <div className="panelSubtitle">
          Pick a major key. See diatonic chords + the modes in that key signature.
        </div>
      </div>

      <div className="cofLayout">
        <div className="cofCircleWrap">
          <div className="cofCircle" role="list" aria-label="Circle of fifths keys">
            {CIRCLE_KEYS.map((k, i) => {
              const { x, y } = posForIndex(i, CIRCLE_KEYS.length, 148);
              const isSelected = selectedKey === k.id;
              const chordInfo = chordByCircleKey.get(k.id);
              const isInKey = Boolean(chordInfo);
              const degreeClass = chordInfo ? `degree-${chordInfo.degreeNumber}` : "";
              return (
                <button
                  key={k.id}
                  type="button"
                  role="listitem"
                  className={[
                    "cofKey",
                    isSelected ? "isSelected" : "",
                    isInKey ? "isInKey" : "isOut",
                    chordInfo?.isRoot ? "isRoot" : "",
                  ].join(" ")}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  onClick={() => setSelectedKey(k.id)}
                  aria-pressed={isSelected}
                >
                  <span className="cofKeyLabel">{k.label}</span>
                  <span
                    className={[
                      "cofKeyChord",
                      chordInfo ? degreeClass : "isEmpty",
                    ].join(" ")}
                  >
                    {chordInfo ? chordInfo.chordText : ""}
                    {chordInfo?.roman && <span className="cofKeyRoman mono">{chordInfo.roman}</span>}
                  </span>
                </button>
              );
            })}
            <div className="cofCenter">
              <div className="cofCenterKey mono">{spelledMajor.root.text}</div>
              <div className="cofCenterLabel">major</div>
            </div>
          </div>

          <div className="cofKeyList" aria-label="Keys (list)">
            {CIRCLE_KEYS.map((k) => {
              const isSelected = selectedKey === k.id;
              return (
                <button
                  key={`list-${k.id}`}
                  type="button"
                  className={["cofKeyListBtn", isSelected ? "isSelected" : ""].join(" ")}
                  onClick={() => setSelectedKey(k.id)}
                  aria-pressed={isSelected}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cofSidebar">
          <div className="cofSectionTitle">Modes in this key signature</div>
          <div className="modeStrip" role="list" aria-label="Modes in this key signature">
            {modes.map((m) => (
              <div key={m.scaleId} role="listitem" className="modePill">
                <div className="modePillTop mono">{m.tonicText}</div>
                <div className="modePillMain">{m.modeName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cofChordBlock">
        <div className="cofInfoHeader">
          <div>
            <div className="cofSectionTitle">Diatonic chords</div>
            <div className="cofInfoSubtitle">
              Triads + 7ths in {spelledMajor.root.text} major.
            </div>
          </div>
          <div className="cofQualityLegend" aria-label="Chord quality legend">
            <span className="cofQualityLabel">Quality</span>
            {qualityLegend.map((q) => (
              <span key={q} className={["qualityTag", `quality-${QUALITY_CATEGORY[q]}`].join(" ")}>
                {QUALITY_LABELS[q]}
              </span>
            ))}
          </div>
        </div>

        {showDiatonic ? (
          <div className="chordMatrix" role="table" aria-label="Diatonic chords matrix">
            <div className="chordMatrixHeader" role="row">
              <div className="chordMatrixCorner" aria-hidden="true" />
              {triads.map((c) => {
                const degreeNumber = spelledMajor.scale.degrees[c.degreeIndex]?.number ?? c.degreeIndex + 1;
                const isRoot = c.degreeIndex === 0;
                return (
                  <div
                    key={`cof-header-${c.degreeIndex}-${c.chordText}`}
                    className={[
                      "chordMatrixHeaderCell",
                      `degree-${degreeNumber}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                  >
                    <div className="chordMatrixHeaderRoman mono">{c.roman ?? c.degreeText}</div>
                    <div className="chordMatrixHeaderDegree">{c.degreeText}</div>
                  </div>
                );
              })}
            </div>

            <div className="chordMatrixRow" role="row">
              <div className="chordMatrixRowLabel">Triads</div>
              {triads.map((c) => {
                const degreeNumber = spelledMajor.scale.degrees[c.degreeIndex]?.number ?? c.degreeIndex + 1;
                const isRoot = c.degreeIndex === 0;
                return (
                  <div
                    key={`cof-triad-${c.degreeIndex}-${c.chordText}`}
                    role="cell"
                    className={[
                      "chordMatrixCell",
                      `degree-${degreeNumber}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                    title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                  >
                    <div className="chordMatrixChord">{c.chordText}</div>
                    <div className={["qualityTag", `quality-${QUALITY_CATEGORY[c.quality]}`].join(" ")}>
                      {QUALITY_LABELS[c.quality]}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chordMatrixRow" role="row">
              <div className="chordMatrixRowLabel">7ths</div>
              {sevenths.map((c) => {
                const degreeNumber = spelledMajor.scale.degrees[c.degreeIndex]?.number ?? c.degreeIndex + 1;
                const isRoot = c.degreeIndex === 0;
                return (
                  <div
                    key={`cof-7th-${c.degreeIndex}-${c.chordText}`}
                    role="cell"
                    className={[
                      "chordMatrixCell",
                      `degree-${degreeNumber}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                    title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                  >
                    <div className="chordMatrixChord">{c.chordText}</div>
                    <div className={["qualityTag", `quality-${QUALITY_CATEGORY[c.quality]}`].join(" ")}>
                      {QUALITY_LABELS[c.quality]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="cofEmpty">No diatonic chord set for this key.</div>
        )}
      </div>

    </section>
  );
}
