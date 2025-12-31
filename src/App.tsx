import { useMemo, useState } from "react";
import "./css/styles.css";
import { SCALES, spellScale, type ScaleDef } from "./lib/music";
import { Controls } from "./components/Controls";
import { DegreeMap } from "./components/DegreeMap";
import { Fretboard } from "./components/Fretboard";

export default function App() {
  const ROOTS = [
    // naturals
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
    // sharps
    "C#",
    "D#",
    "F#",
    "G#",
    "A#",
    // flats
    "Db",
    "Eb",
    "Gb",
    "Ab",
    "Bb",
    // edge spellings (you wanted Cb major support)
    "Cb",
    "Fb",
    "E#",
    "B#",
  ];

  const [root, setRoot] = useState<string>("C");
  const [scaleId, setScaleId] = useState<string>("major");

  const scale: ScaleDef = useMemo(() => {
    return SCALES.find((s) => s.id === scaleId) ?? SCALES[0];
  }, [scaleId]);

  const spelled = useMemo(() => spellScale(root, scale), [root, scale]);

  return (
    <div className="app">
      <header className="header">
        <div className="titleBlock">
          <div className="title">Jazz Fretboard Trainer</div>
          <div className="subtitle">
            Spell it right. See it everywhere. Play it with the band.
          </div>
        </div>
        <Controls
          roots={ROOTS}
          scales={SCALES}
          root={root}
          scaleId={scaleId}
          onRootChange={setRoot}
          onScaleChange={setScaleId}
        />
      </header>

      <main className="main">
        <DegreeMap spelled={spelled} />
        <Fretboard spelled={spelled} />
      </main>
    </div>
  );
}
