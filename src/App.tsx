import { useEffect, useMemo, useState } from "react";
import "./css/styles.css";
import { SCALES, spellScale, type ScaleDef } from "./lib/music";
import { CircleOfFifthsTool } from "./components/CircleOfFifthsTool";
import { Fretboard } from "./components/Fretboard";
import type { ChordFocus } from "./lib/harmony";

const STANDARD_TUNING = ["E", "B", "G", "D", "A", "E"] as const;
const THEME_STORAGE_KEY = "guitar-theme";
const ROOT_STORAGE_KEY = "guitar-root";
const SCALE_STORAGE_KEY = "guitar-scale";
const TUNING_STORAGE_KEY = "guitar-tuning";
type Theme = "light" | "dark";

export default function App() {
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

  const scale: ScaleDef = useMemo(() => {
    return SCALES.find((s) => s.id === scaleId) ?? SCALES[0];
  }, [scaleId]);

  const spelled = useMemo(() => spellScale(root, scale), [root, scale]);

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
            className="themeToggle"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            aria-pressed={theme === "dark"}
          >
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <main className="main">
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
        <Fretboard
          spelled={spelled}
          tuning={tuning}
          onTuningChange={(index, value) =>
            setTuning((prev) => prev.map((note, i) => (i === index ? value : note)))
          }
          onResetTuning={() => setTuning([...STANDARD_TUNING])}
          chordFocus={chordFocus}
          onClearChordFocus={() => setChordFocus(null)}
        />
      </main>
    </div>
  );
}
