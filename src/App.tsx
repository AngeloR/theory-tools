import { useMemo, useState } from "react";
import "./css/styles.css";
import { SCALES, spellScale, type ScaleDef } from "./lib/music";
import { Controls } from "./components/Controls";
import { DegreeMap } from "./components/DegreeMap";
import { CircleOfFifthsTool } from "./components/CircleOfFifthsTool";
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
  const STANDARD_TUNING = ["E", "B", "G", "D", "A", "E"];
  const [tuning, setTuning] = useState<string[]>(STANDARD_TUNING);

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
      </header>

      <main className="main">
        <section className="panel controlsPanel">
          <div className="panelHeader">
            <div className="panelTitle">Key + Scale</div>
            <div className="panelSubtitle">
              Drives the degree map and the fretboard.
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
        </section>
        <DegreeMap spelled={spelled} />
        <CircleOfFifthsTool />
        <Fretboard
          spelled={spelled}
          tuning={tuning}
          onTuningChange={(index, value) =>
            setTuning((prev) => prev.map((note, i) => (i === index ? value : note)))
          }
          onResetTuning={() => setTuning(STANDARD_TUNING)}
        />
      </main>
    </div>
  );
}
