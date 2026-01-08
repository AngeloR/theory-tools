import { formatDegree, type SpelledScale } from "../lib/music";
import { buildDiatonicChords, isDiatonic7Unique } from "../lib/harmony";

export function DegreeMap({ spelled }: { spelled: SpelledScale }) {
  const formula = spelled.scale.degrees.map(formatDegree).join("  ");
  const showDiatonicChords = isDiatonic7Unique(spelled);
  const triads = showDiatonicChords ? buildDiatonicChords(spelled, "triad") : [];
  const sevenths = showDiatonicChords ? buildDiatonicChords(spelled, "7th") : [];

  return (
    <section className="panel degreePanel">
      <div className="panelHeader">
        <div className="panelTitle">Degree Map</div>
        <div className="panelSubtitle">
          Formula: <span className="mono">{formula}</span>
        </div>
      </div>

      <div className="degreeStrip" role="list" aria-label="Scale degrees">
        {spelled.degrees.map((d, idx) => {
          const isRoot = idx === 0; // degree 1 in these scales
          return (
            <div
              key={`${d.note.text}-${idx}`}
              role="listitem"
              className={[
                "degreePill",
                `degree-${d.degree.number}`,
                isRoot ? "isRoot" : "",
              ].join(" ")}
              title={`${d.note.text} (${formatDegree(d.degree)})`}
            >
              <div className="degreePillDegree mono">{formatDegree(d.degree)}</div>
              <div className="degreePillNote">{d.note.text}</div>
            </div>
          );
        })}
      </div>

      {showDiatonicChords && (
        <>
          <div className="chordSection">
            <div className="chordSectionTitle">Diatonic chords (triads)</div>
            <div className="chordStrip" role="list" aria-label="Diatonic triads">
              {triads.map((c) => {
                const isRoot = c.degreeIndex === 0;
                return (
                  <div
                    key={`triad-${c.degreeIndex}-${c.chordText}`}
                    role="listitem"
                    className={[
                      "chordPill",
                      `degree-${spelled.scale.degrees[c.degreeIndex]?.number}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                    title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                  >
                    <div className="chordPillTop mono">
                      {c.roman ? `${c.roman} · ` : ""}
                      {c.degreeText}
                    </div>
                    <div className="chordPillMain">{c.chordText}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chordSection">
            <div className="chordSectionTitle">Diatonic chords (7ths)</div>
            <div className="chordStrip" role="list" aria-label="Diatonic seventh chords">
              {sevenths.map((c) => {
                const isRoot = c.degreeIndex === 0;
                return (
                  <div
                    key={`7th-${c.degreeIndex}-${c.chordText}`}
                    role="listitem"
                    className={[
                      "chordPill",
                      `degree-${spelled.scale.degrees[c.degreeIndex]?.number}`,
                      isRoot ? "isRoot" : "",
                    ].join(" ")}
                    title={`${c.degreeText}${c.roman ? ` (${c.roman})` : ""}`}
                  >
                    <div className="chordPillTop mono">
                      {c.roman ? `${c.roman} · ` : ""}
                      {c.degreeText}
                    </div>
                    <div className="chordPillMain">{c.chordText}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <details className="teacherHintDetails">
        <summary>Teacher hint</summary>
        <div className="teacherHint">
          Call the degrees out loud (“♭3”, “6”, “7”) as fast as you name the
          notes.
        </div>
      </details>
    </section>
  );
}
