import { useEffect, useMemo, useState } from "react";
import { SCALES, parseRoot, spellScale } from "../lib/music";
import {
  buildDiatonicChords,
  chordTonesForDiatonic,
  isDiatonic7Unique,
  modesForMajorKeySignature,
  type ChordFocus,
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
const COF_MODE_STORAGE_KEY = "guitar-cof-mode";
type KeyMode = "major" | "minor" | "diminished";
type ChordRing = "major" | "minor" | "diminished";

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

export function CircleOfFifthsTool({
  chordFocus,
  onChordFocus,
  activeRoot,
  activeScaleId,
  onScaleSelect,
}: {
  chordFocus: ChordFocus | null;
  onChordFocus: (focus: ChordFocus | null) => void;
  activeRoot: string;
  activeScaleId: string;
  onScaleSelect: (rootText: string, scaleId: string) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string>(() => {
    if (typeof window === "undefined") return "C";
    const stored = window.localStorage.getItem(COF_STORAGE_KEY) ?? "C";
    return CIRCLE_KEY_IDS.has(stored) ? stored : "C";
  });
  const [keyMode, setKeyMode] = useState<KeyMode>(() => {
    if (typeof window === "undefined") return "major";
    const stored = window.localStorage.getItem(COF_MODE_STORAGE_KEY);
    return stored === "minor" || stored === "major" || stored === "diminished"
      ? stored
      : "major";
  });
  const major = useMemo(() => SCALES.find((s) => s.id === "major") ?? SCALES[0], []);
  const minor = useMemo(
    () => SCALES.find((s) => s.id === "natural_minor") ?? SCALES[0],
    [],
  );
  const locrian = useMemo(
    () => SCALES.find((s) => s.id === "locrian") ?? SCALES[0],
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COF_STORAGE_KEY, selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COF_MODE_STORAGE_KEY, keyMode);
  }, [keyMode]);

  const relativeMinorMap = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    CIRCLE_KEYS.forEach((k) => {
      const spelled = spellScale(k.id, major);
      const relNote = spelled.degrees[5]?.note.text;
      if (!relNote) return;
      map.set(k.id, {
        id: normalizeNoteId(relNote),
        label: `${relNote}m`,
      });
    });
    return map;
  }, [major]);

  const dimMaps = useMemo(() => {
    const labelMap = new Map<string, string>();
    const idMap = new Map<string, string>();
    CIRCLE_KEYS.forEach((k) => {
      const spelled = spellScale(k.id, major);
      const leadingTone = spelled.degrees[6]?.note.text;
      if (!leadingTone) return;
      labelMap.set(k.id, `${leadingTone}°`);
      idMap.set(k.id, normalizeNoteId(leadingTone));
    });
    return { labelMap, idMap };
  }, [major]);
  const dimLabelMap = dimMaps.labelMap;
  const dimKeyMap = dimMaps.idMap;

  const minorToMajorMap = useMemo(() => {
    const map = new Map<string, string>();
    relativeMinorMap.forEach((minor, majorId) => {
      map.set(minor.id, majorId);
    });
    return map;
  }, [relativeMinorMap]);

  const minorPcMap = useMemo(() => {
    const map = new Map<number, string>();
    minorToMajorMap.forEach((_, minorId) => {
      map.set(parseRoot(minorId).pc, minorId);
    });
    return map;
  }, [minorToMajorMap]);

  const dimToMajorMap = useMemo(() => {
    const map = new Map<string, string>();
    dimKeyMap.forEach((dimId, majorId) => {
      map.set(dimId, majorId);
    });
    return map;
  }, [dimKeyMap]);

  const dimPcMap = useMemo(() => {
    const map = new Map<number, string>();
    dimKeyMap.forEach((dimId) => {
      map.set(parseRoot(dimId).pc, dimId);
    });
    return map;
  }, [dimKeyMap]);

  const activeKeyId =
    keyMode === "major"
      ? selectedKey
      : keyMode === "minor"
        ? relativeMinorMap.get(selectedKey)?.id ?? selectedKey
        : dimKeyMap.get(selectedKey) ?? selectedKey;
  const normalizedActiveRoot = normalizeNoteId(activeRoot);

  const signatureMajor = useMemo(
    () => spellScale(selectedKey, major),
    [selectedKey, major],
  );

  const spelledKey = useMemo(() => {
    const scale =
      keyMode === "major" ? major : keyMode === "minor" ? minor : locrian;
    return spellScale(activeKeyId, scale);
  }, [activeKeyId, keyMode, locrian, major, minor]);

  useEffect(() => {
    if (
      chordFocus &&
      (chordFocus.keyId !== activeKeyId || chordFocus.mode !== keyMode)
    ) {
      onChordFocus(null);
    }
  }, [activeKeyId, chordFocus, keyMode, onChordFocus]);

  const showDiatonic = isDiatonic7Unique(spelledKey);
  const triads = showDiatonic ? buildDiatonicChords(spelledKey, "triad") : [];
  const sevenths = showDiatonic ? buildDiatonicChords(spelledKey, "7th") : [];
  const modes = modesForMajorKeySignature(signatureMajor);
  const modeStartIndex = useMemo(() => {
    if (keyMode === "major") return 0;
    const activePc = parseRoot(activeKeyId).pc;
    const idx = signatureMajor.degrees.findIndex((d) => d.note.pc === activePc);
    return idx >= 0 ? idx : 0;
  }, [activeKeyId, keyMode, signatureMajor]);
  const orderedModes = useMemo(() => {
    if (modes.length === 0 || modeStartIndex === 0) return modes;
    return [...modes.slice(modeStartIndex), ...modes.slice(0, modeStartIndex)];
  }, [modes, modeStartIndex]);
  const modeSignatureLabel =
    keyMode === "major"
      ? `${signatureMajor.root.text} major`
      : keyMode === "minor"
        ? `${spelledKey.root.text} minor · ${signatureMajor.root.text} major`
        : `${spelledKey.root.text} dim · ${signatureMajor.root.text} major`;
  const keyModeLabel = keyMode === "diminished" ? "dim" : keyMode;

  const qualityLegend = useMemo(() => {
    const used = new Set([...triads, ...sevenths].map((c) => c.quality));
    return QUALITY_ORDER.filter((q) => used.has(q));
  }, [triads, sevenths]);

  const ringForQuality = (quality: DiatonicChord["quality"]): ChordRing => {
    const category = QUALITY_CATEGORY[quality];
    if (
      category === "diminished" ||
      category === "half-diminished"
    ) {
      return "diminished";
    }
    if (category === "minor") {
      return "minor";
    }
    return "major";
  };

  const chordByRing = useMemo(() => {
    const majorMap = new Map<
      string,
      {
        chordText: string;
        roman?: string;
        degreeNumber: number;
        isRoot: boolean;
      }
    >();
    const minorMap = new Map<
      string,
      {
        chordText: string;
        roman?: string;
        degreeNumber: number;
        isRoot: boolean;
      }
    >();
    const dimMap = new Map<
      string,
      {
        chordText: string;
        roman?: string;
        degreeNumber: number;
        isRoot: boolean;
      }
    >();

    const circleIdForMinor = (rootNote: string) => {
      const normalizedRoot = normalizeNoteId(rootNote);
      const rootPc = parseRoot(normalizedRoot).pc;
      const minorId = minorPcMap.get(rootPc);
      if (minorId) return minorToMajorMap.get(minorId);
      const enharmonicId = circleIdForNote(rootNote);
      return enharmonicId
        ? minorToMajorMap.get(enharmonicId) ?? enharmonicId
        : undefined;
    };

    triads.forEach((chord) => {
      const rootNote = spelledKey.degrees[chord.degreeIndex]?.note.text;
      const degreeNumber =
        spelledKey.scale.degrees[chord.degreeIndex]?.number ??
        chord.degreeIndex + 1;
      if (!rootNote) return;

      const ring = ringForQuality(chord.quality);
      let circleId: string | undefined;
      if (ring === "minor") {
        circleId = circleIdForMinor(rootNote);
      } else if (ring === "diminished") {
        const normalizedRoot = normalizeNoteId(rootNote);
        const rootPc = parseRoot(normalizedRoot).pc;
        const dimId = dimPcMap.get(rootPc);
        circleId = dimId ? dimToMajorMap.get(dimId) : undefined;
      } else {
        circleId = circleIdForNote(rootNote);
      }
      if (!circleId) return;

      const targetMap =
        ring === "minor" ? minorMap : ring === "diminished" ? dimMap : majorMap;
      targetMap.set(circleId, {
        chordText: chord.chordText,
        roman: chord.roman,
        degreeNumber,
        isRoot: chord.degreeIndex === 0,
      });
    });

    return { major: majorMap, minor: minorMap, diminished: dimMap };
  }, [dimPcMap, dimToMajorMap, minorPcMap, minorToMajorMap, spelledKey, triads]);

  const handleChordSelect = (kind: "triad" | "7th", chord: DiatonicChord) => {
    const chordId = `${kind}-${keyMode}-${activeKeyId}-${chord.degreeIndex}`;
    if (chordFocus?.id === chordId) {
      onChordFocus(null);
      return;
    }

    const tones = chordTonesForDiatonic(spelledKey, chord, kind);
    onChordFocus({
      id: chordId,
      keyId: activeKeyId,
      mode: keyMode,
      kind,
      label: chord.chordText,
      tones,
    });
  };

  const handleKeySelect = (mode: KeyMode, keyId: string) => {
    setKeyMode(mode);
    setSelectedKey(keyId);
    if (mode === "major") {
      onScaleSelect(keyId, major.id);
      return;
    }
    if (mode === "minor") {
      const minorKey = relativeMinorMap.get(keyId)?.id ?? keyId;
      onScaleSelect(minorKey, minor.id);
      return;
    }
    const dimKey = dimKeyMap.get(keyId) ?? keyId;
    onScaleSelect(dimKey, locrian.id);
  };

  return (
    <section className="panel cofPanel">
      <div className="panelHeader">
        <div className="panelTitle">Circle of Fifths</div>
        <div className="panelSubtitle">
          Outer ring = major keys. Inner ring = relative minor keys. Click any
          key to focus it. Center ring = diminished keys aligned to each major
          key. Chords land on the ring that matches their quality.
        </div>
      </div>

      <div className="cofLayout">
        <div className="cofCircleWrap">
          <div className="cofCircle" role="list" aria-label="Circle of fifths keys">
            <div className="cofRingDim" aria-hidden="true" />
            {CIRCLE_KEYS.map((k, i) => {
              const { x, y } = posForIndex(i, CIRCLE_KEYS.length, 210);
              const isSelected = keyMode === "major" && selectedKey === k.id;
              const chordInfo = chordByRing.major.get(k.id);
              const isInKey = Boolean(chordInfo);
              const degreeClass = chordInfo ? `degree-${chordInfo.degreeNumber}` : "";
              return (
                <button
                  key={k.id}
                  type="button"
                  role="listitem"
                  className={[
                    "cofKey",
                    "cofKeyMajor",
                    isSelected ? "isSelected" : "",
                    isInKey ? "isInKey" : "isOut",
                    chordInfo?.isRoot ? "isRoot" : "",
                  ].join(" ")}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  onClick={() => handleKeySelect("major", k.id)}
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
            {CIRCLE_KEYS.map((k, i) => {
              const { x, y } = posForIndex(i, CIRCLE_KEYS.length, 140);
              const minorLabel = relativeMinorMap.get(k.id)?.label ?? `${k.label}m`;
              const isSelected = keyMode === "minor" && selectedKey === k.id;
              const chordInfo = chordByRing.minor.get(k.id);
              const isInKey = Boolean(chordInfo);
              const degreeClass = chordInfo ? `degree-${chordInfo.degreeNumber}` : "";
              return (
                <button
                  key={`minor-${k.id}`}
                  type="button"
                  role="listitem"
                  className={[
                    "cofKey",
                    "cofKeyMinor",
                    isSelected ? "isSelected" : "",
                    isInKey ? "isInKey" : "isOut",
                    chordInfo?.isRoot ? "isRoot" : "",
                  ].join(" ")}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  onClick={() => handleKeySelect("minor", k.id)}
                  aria-pressed={isSelected}
                >
                  <span className="cofKeyLabel">{minorLabel}</span>
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
            {CIRCLE_KEYS.map((k, i) => {
              const { x, y } = posForIndex(i, CIRCLE_KEYS.length, 86);
              const dimLabel = dimLabelMap.get(k.id) ?? `${k.label}°`;
              const isSelected = keyMode === "diminished" && selectedKey === k.id;
              const chordInfo = chordByRing.diminished.get(k.id);
              const isInKey = Boolean(chordInfo);
              const degreeClass = chordInfo ? `degree-${chordInfo.degreeNumber}` : "";
              return (
                <button
                  key={`dim-${k.id}`}
                  type="button"
                  role="listitem"
                  className={[
                    "cofKey",
                    "cofKeyDim",
                    isSelected ? "isSelected" : "",
                    isInKey ? "isInKey" : "isOut",
                    chordInfo?.isRoot ? "isRoot" : "",
                  ].join(" ")}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  onClick={() => handleKeySelect("diminished", k.id)}
                  aria-pressed={isSelected}
                >
                  <span className="cofKeyLabel">{dimLabel}</span>
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
              <div className="cofCenterKey mono">{spelledKey.root.text}</div>
              <div className="cofCenterLabel">{keyModeLabel}</div>
            </div>
          </div>

          <div className="cofKeyList" aria-label="Keys (list)">
            <div className="cofKeyListSection">
              <div className="cofKeyListTitle">Major keys</div>
              <div className="cofKeyListRow">
                {CIRCLE_KEYS.map((k) => {
                  const isSelected = keyMode === "major" && selectedKey === k.id;
                  return (
                    <button
                      key={`list-major-${k.id}`}
                      type="button"
                      className={["cofKeyListBtn", isSelected ? "isSelected" : ""].join(" ")}
                      onClick={() => handleKeySelect("major", k.id)}
                      aria-pressed={isSelected}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cofKeyListSection">
              <div className="cofKeyListTitle">Minor keys</div>
              <div className="cofKeyListRow">
                {CIRCLE_KEYS.map((k) => {
                  const isSelected = keyMode === "minor" && selectedKey === k.id;
                  const minorLabel = relativeMinorMap.get(k.id)?.label ?? `${k.label}m`;
                  return (
                    <button
                      key={`list-minor-${k.id}`}
                      type="button"
                      className={["cofKeyListBtn", isSelected ? "isSelected" : ""].join(" ")}
                      onClick={() => handleKeySelect("minor", k.id)}
                      aria-pressed={isSelected}
                    >
                      {minorLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cofKeyListSection">
              <div className="cofKeyListTitle">Diminished keys</div>
              <div className="cofKeyListRow">
                {CIRCLE_KEYS.map((k) => {
                  const isSelected = keyMode === "diminished" && selectedKey === k.id;
                  const dimLabel = dimLabelMap.get(k.id) ?? `${k.label}°`;
                  return (
                    <button
                      key={`list-dim-${k.id}`}
                      type="button"
                      className={["cofKeyListBtn", isSelected ? "isSelected" : ""].join(" ")}
                      onClick={() => handleKeySelect("diminished", k.id)}
                      aria-pressed={isSelected}
                    >
                      {dimLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="cofRail">
          <div className="cofModesBlock">
            <div className="cofSectionTitle">
              Modes in key signature ({modeSignatureLabel})
            </div>
            <div className="modeStrip" role="list" aria-label="Modes in this key signature">
              {orderedModes.map((m) => {
                const modeRoot = normalizeNoteId(m.tonicText);
                const isActive =
                  modeRoot === normalizedActiveRoot && m.scaleId === activeScaleId;
                return (
                  <button
                    key={m.scaleId}
                    type="button"
                    role="listitem"
                    className={["modePill", isActive ? "isSelected" : ""].join(" ")}
                    onClick={() => onScaleSelect(modeRoot, m.scaleId)}
                    aria-pressed={isActive}
                  >
                    <div className="modePillTop mono">{m.tonicText}</div>
                    <div className="modePillMain">{m.modeName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cofChordBlock">
            <div className="cofInfoHeader">
              <div>
                <div className="cofSectionTitle">Diatonic chords</div>
                <div className="cofInfoSubtitle">
                  Triads + 7ths in {spelledKey.root.text} {keyMode}. Click a chord to
                  highlight it on the fretboard.
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
                    const degreeNumber =
                      spelledKey.scale.degrees[c.degreeIndex]?.number ??
                      c.degreeIndex + 1;
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
                    const degreeNumber =
                      spelledKey.scale.degrees[c.degreeIndex]?.number ??
                      c.degreeIndex + 1;
                    const isRoot = c.degreeIndex === 0;
                    const chordId = `triad-${keyMode}-${activeKeyId}-${c.degreeIndex}`;
                    const isSelected = chordFocus?.id === chordId;
                    return (
                      <button
                        key={`cof-triad-${c.degreeIndex}-${c.chordText}`}
                        type="button"
                        role="cell"
                        className={[
                          "chordMatrixCell",
                          `degree-${degreeNumber}`,
                          isRoot ? "isRoot" : "",
                          isSelected ? "isSelected" : "",
                        ].join(" ")}
                        title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                        onClick={() => handleChordSelect("triad", c)}
                        aria-pressed={isSelected}
                      >
                        <div className="chordMatrixChord">{c.chordText}</div>
                        <div className={["qualityTag", `quality-${QUALITY_CATEGORY[c.quality]}`].join(" ")}>
                          {QUALITY_LABELS[c.quality]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="chordMatrixRow" role="row">
                  <div className="chordMatrixRowLabel">7ths</div>
                  {sevenths.map((c) => {
                    const degreeNumber =
                      spelledKey.scale.degrees[c.degreeIndex]?.number ??
                      c.degreeIndex + 1;
                    const isRoot = c.degreeIndex === 0;
                    const chordId = `7th-${keyMode}-${activeKeyId}-${c.degreeIndex}`;
                    const isSelected = chordFocus?.id === chordId;
                    return (
                      <button
                        key={`cof-7th-${c.degreeIndex}-${c.chordText}`}
                        type="button"
                        role="cell"
                        className={[
                          "chordMatrixCell",
                          `degree-${degreeNumber}`,
                          isRoot ? "isRoot" : "",
                          isSelected ? "isSelected" : "",
                        ].join(" ")}
                        title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                        onClick={() => handleChordSelect("7th", c)}
                        aria-pressed={isSelected}
                      >
                        <div className="chordMatrixChord">{c.chordText}</div>
                        <div className={["qualityTag", `quality-${QUALITY_CATEGORY[c.quality]}`].join(" ")}>
                          {QUALITY_LABELS[c.quality]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="cofEmpty">No diatonic chord set for this key.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
