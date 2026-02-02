import { useEffect, useMemo, useState } from "react";
import "./css/styles.css";
import { SCALES, spellScale, type ScaleDef, type SpelledScale } from "./lib/music";
import { CircleOfFifthsTool } from "./components/CircleOfFifthsTool";
import { Fretboard, type CagedShapeId } from "./components/Fretboard";
import type { ChordFocus } from "./lib/harmony";
import { ModesTool, type ModeOption } from "./components/ModesTool";

const STANDARD_TUNING = ["E", "B", "G", "D", "A", "E"] as const;
const THEME_STORAGE_KEY = "guitar-theme";
const ROOT_STORAGE_KEY = "guitar-root";
const SCALE_STORAGE_KEY = "guitar-scale";
const TUNING_STORAGE_KEY = "guitar-tuning";
const SNAPSHOT_STORAGE_KEY = "guitar-snapshots";
type Theme = "light" | "dark";
type TabId = "circle" | "modes";
type StoredSnapshot = {
  id: string;
  title: string;
  root: string;
  scaleId: string;
  tuning: string[];
  chordFocus: ChordFocus | null;
  activeCagedId: CagedShapeId | null;
};
type FretboardSnapshot = {
  id: string;
  title: string;
  root: string;
  scaleId: string;
  spelled: SpelledScale;
  tuning: string[];
  chordFocus: ChordFocus | null;
  activeCagedId: CagedShapeId | null;
};

const MODE_OPTIONS: ModeOption[] = [
  { id: "major", label: "Ionian" },
  { id: "dorian", label: "Dorian" },
  { id: "phrygian", label: "Phrygian" },
  { id: "lydian", label: "Lydian" },
  { id: "mixolydian", label: "Mixolydian" },
  { id: "natural_minor", label: "Aeolian" },
  { id: "locrian", label: "Locrian" },
];

const ROOT_OPTIONS = [
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

const createSnapshotId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const FALLBACK_SCALE = SCALES.find((s) => s.id === "major") ?? SCALES[0];

const resolveScale = (id: string) => SCALES.find((s) => s.id === id) ?? FALLBACK_SCALE;

const isChordFocus = (value: unknown): value is ChordFocus => {
  if (!value || typeof value !== "object") return false;
  const v = value as ChordFocus;
  if (typeof v.id !== "string") return false;
  if (typeof v.keyId !== "string") return false;
  if (v.mode !== "major" && v.mode !== "minor" && v.mode !== "diminished") return false;
  if (v.kind !== "triad" && v.kind !== "7th") return false;
  if (typeof v.label !== "string") return false;
  if (!Array.isArray(v.tones)) return false;
  return v.tones.every(
    (tone) =>
      tone &&
      typeof tone.pc === "number" &&
      typeof tone.text === "string" &&
      (tone.degree === "1" ||
        tone.degree === "3" ||
        tone.degree === "5" ||
        tone.degree === "7"),
  );
};

const isCagedId = (value: unknown): value is CagedShapeId =>
  value === "C" || value === "A" || value === "G" || value === "E" || value === "D";

const sanitizeTuning = (value: unknown): string[] => {
  if (
    Array.isArray(value) &&
    value.length === STANDARD_TUNING.length &&
    value.every((note) => typeof note === "string")
  ) {
    return value;
  }
  return [...STANDARD_TUNING];
};

const hydrateSnapshots = (value: unknown): FretboardSnapshot[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((snapshot) => {
    if (!snapshot || typeof snapshot !== "object") return [];
    const candidate = snapshot as StoredSnapshot;
    if (typeof candidate.id !== "string") return [];
    if (typeof candidate.title !== "string") return [];
    if (typeof candidate.root !== "string") return [];
    if (typeof candidate.scaleId !== "string") return [];

    try {
      spellScale(candidate.root, FALLBACK_SCALE);
    } catch {
      return [];
    }

    const resolvedScale = resolveScale(candidate.scaleId);
    return [
      {
        id: candidate.id,
        title: candidate.title,
        root: candidate.root,
        scaleId: resolvedScale.id,
        spelled: spellScale(candidate.root, resolvedScale),
        tuning: sanitizeTuning(candidate.tuning),
        chordFocus: isChordFocus(candidate.chordFocus) ? candidate.chordFocus : null,
        activeCagedId: isCagedId(candidate.activeCagedId) ? candidate.activeCagedId : null,
      },
    ];
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("circle");
  const [root, setRoot] = useState<string>(() => {
    if (typeof window === "undefined") return "C";
    return window.localStorage.getItem(ROOT_STORAGE_KEY) ?? "C";
  });
  const [scaleId, setScaleId] = useState<string>(() => {
    if (typeof window === "undefined") return "major";
    return window.localStorage.getItem(SCALE_STORAGE_KEY) ?? "major";
  });
  const [tuning, setTuning] = useState<string[]>(() => {
    if (typeof window === "undefined") return [...STANDARD_TUNING];
    const stored = window.localStorage.getItem(TUNING_STORAGE_KEY);
    if (!stored) return [...STANDARD_TUNING];
    try {
      const parsed = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.length === STANDARD_TUNING.length &&
        parsed.every((note) => typeof note === "string")
      ) {
        return parsed;
      }
    } catch {
      // fall back to standard
    }
    return [...STANDARD_TUNING];
  });
  const [chordFocus, setChordFocus] = useState<ChordFocus | null>(null);
  const [snapshots, setSnapshots] = useState<FretboardSnapshot[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!stored) return [];
    try {
      return hydrateSnapshots(JSON.parse(stored));
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROOT_STORAGE_KEY, root);
  }, [root]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCALE_STORAGE_KEY, scaleId);
  }, [scaleId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuning));
  }, [tuning]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSnapshots: StoredSnapshot[] = snapshots.map((snapshot) => ({
      id: snapshot.id,
      title: snapshot.title,
      root: snapshot.root,
      scaleId: snapshot.scaleId,
      tuning: snapshot.tuning,
      chordFocus: snapshot.chordFocus,
      activeCagedId: snapshot.activeCagedId,
    }));
    window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(storedSnapshots));
  }, [snapshots]);

  const scale: ScaleDef = useMemo(() => {
    return SCALES.find((s) => s.id === scaleId) ?? SCALES[0];
  }, [scaleId]);

  const spelled = useMemo(() => spellScale(root, scale), [root, scale]);

  const handleSnapshot = (activeCagedId: CagedShapeId | null) => {
    const title = chordFocus
      ? chordFocus.label
      : `${spelled.root.text} ${spelled.scale.name}`;
    setSnapshots((prev) => [
      {
        id: createSnapshotId(),
        title,
        root,
        scaleId,
        spelled,
        tuning: [...tuning],
        chordFocus,
        activeCagedId,
      },
      ...prev,
    ]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== id));
  };

  return (
    <div className="app">
      <header className="header">
        <div className="titleBlock">
          <div className="title">Guitar Theory Tools</div>
          <div className="subtitle">
            Spell it right. See it everywhere. Play it with the band.
          </div>
        </div>
        <div className="headerActions">
          <button
            type="button"
            className="tabSwitchButton"
            onClick={() =>
              setActiveTab((prev) => (prev === "circle" ? "modes" : "circle"))
            }
            aria-label={
              activeTab === "circle"
                ? "Switch to Modes"
                : "Switch to Circle of Fifths"
            }
          >
            {activeTab === "circle" ? "Switch to Modes" : "Switch to Circle of Fifths"}
          </button>
          <button
            type="button"
            className="themeToggle"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            aria-pressed={theme === "dark"}
          >
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="tabShell">
          <div className="tabPanel" hidden={activeTab !== "circle"}>
            <CircleOfFifthsTool
              chordFocus={chordFocus}
              onChordFocus={setChordFocus}
              activeRoot={root}
              activeScaleId={scaleId}
              onScaleSelect={(nextRoot, nextScaleId) => {
                setRoot(nextRoot);
                setScaleId(nextScaleId);
              }}
            />
          </div>

          <div className="tabPanel" hidden={activeTab !== "modes"}>
            <ModesTool
              root={root}
              modeId={scaleId}
              rootOptions={ROOT_OPTIONS}
              modes={MODE_OPTIONS}
              onRootChange={setRoot}
              onModeChange={setScaleId}
            />
          </div>
        </div>
        <Fretboard
          spelled={spelled}
          tuning={tuning}
          onTuningChange={(index, value) =>
            setTuning((prev) => prev.map((note, i) => (i === index ? value : note)))
          }
          onResetTuning={() => setTuning([...STANDARD_TUNING])}
          chordFocus={chordFocus}
          onClearChordFocus={() => setChordFocus(null)}
          onSnapshot={handleSnapshot}
        />
        {snapshots.length > 0 && (
          <section className="snapshotSection">
            <div className="snapshotHeader">
              <div className="snapshotTitle">Snapshots</div>
              <div className="snapshotSubtitle">Saved fretboard views.</div>
            </div>
            <div className="snapshotList">
              {snapshots.map((snapshot) => (
                <Fretboard
                  key={snapshot.id}
                  spelled={snapshot.spelled}
                  tuning={snapshot.tuning}
                  onTuningChange={() => {}}
                  onResetTuning={() => {}}
                  chordFocus={snapshot.chordFocus}
                  onClearChordFocus={() => {}}
                  readOnly
                  panelTitle={`Snapshot - ${snapshot.title}`}
                  panelSubtitle={null}
                  headerActions={
                    <button
                      type="button"
                      className="snapshotDelete"
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                    >
                      Delete
                    </button>
                  }
                  initialCagedId={snapshot.activeCagedId}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
