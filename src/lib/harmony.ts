import { formatDegree, type SpelledScale } from "./music";

export type DiatonicChord = {
  degreeIndex: number;
  degreeText: string;
  roman?: string;
  chordText: string;
  quality:
    | "maj"
    | "min"
    | "dim"
    | "aug"
    | "maj7"
    | "7"
    | "m7"
    | "m7b5"
    | "dim7"
    | "mMaj7"
    | "augMaj7"
    | "aug7";
};

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function triadQuality(third: number, fifth: number): "maj" | "min" | "dim" | "aug" {
  if (third === 4 && fifth === 7) return "maj";
  if (third === 3 && fifth === 7) return "min";
  if (third === 3 && fifth === 6) return "dim";
  if (third === 4 && fifth === 8) return "aug";
  // Fallback: treat unknown as major-ish (keeps UI stable for exotic future scales)
  return "maj";
}

function seventhQuality(third: number, fifth: number, seventh: number): DiatonicChord["quality"] {
  if (third === 4 && fifth === 7 && seventh === 11) return "maj7";
  if (third === 4 && fifth === 7 && seventh === 10) return "7";
  if (third === 3 && fifth === 7 && seventh === 10) return "m7";
  if (third === 3 && fifth === 6 && seventh === 10) return "m7b5";
  if (third === 3 && fifth === 6 && seventh === 9) return "dim7";
  if (third === 3 && fifth === 7 && seventh === 11) return "mMaj7";
  if (third === 4 && fifth === 8 && seventh === 11) return "augMaj7";
  if (third === 4 && fifth === 8 && seventh === 10) return "aug7";
  // Fallback
  return "7";
}

function qualitySuffix(q: DiatonicChord["quality"]): string {
  switch (q) {
    case "maj":
      return "";
    case "min":
      return "m";
    case "dim":
      return "dim";
    case "aug":
      return "aug";
    case "maj7":
      return "maj7";
    case "7":
      return "7";
    case "m7":
      return "m7";
    case "m7b5":
      return "m7♭5";
    case "dim7":
      return "dim7";
    case "mMaj7":
      return "m(maj7)";
    case "augMaj7":
      return "aug(maj7)";
    case "aug7":
      return "aug7";
  }
}

function romanNumeralForTriad(degreeNumber: number, q: "maj" | "min" | "dim" | "aug"): string {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const base = romans[degreeNumber - 1] ?? `${degreeNumber}`;
  if (q === "maj") return base;
  if (q === "min") return base.toLowerCase();
  if (q === "dim") return `${base.toLowerCase()}°`;
  return `${base}+`;
}

export function isDiatonic7Unique(spelled: SpelledScale): boolean {
  return (
    spelled.scale.degrees.length === 7 &&
    spelled.scale.degrees.every((d) => Number.isInteger(d.number) && d.number >= 1 && d.number <= 7) &&
    new Set(spelled.scale.degrees.map((d) => d.number)).size === 7
  );
}

export function buildDiatonicChords(spelled: SpelledScale, kind: "triad" | "7th"): DiatonicChord[] {
  const N = spelled.scale.degrees.length;
  if (N < 3) return [];

  const chords: DiatonicChord[] = [];

  for (let i = 0; i < N; i++) {
    const root = spelled.degrees[i]?.note;
    if (!root) continue;

    const thirdIdx = mod(i + 2, N);
    const fifthIdx = mod(i + 4, N);
    const third = spelled.degrees[thirdIdx]?.note;
    const fifth = spelled.degrees[fifthIdx]?.note;
    if (!third || !fifth) continue;

    const thirdInt = mod(third.pc - root.pc, 12);
    const fifthInt = mod(fifth.pc - root.pc, 12);

    if (kind === "triad") {
      const q = triadQuality(thirdInt, fifthInt);
      const suffix = qualitySuffix(q);
      const degree = spelled.scale.degrees[i];
      const degreeText = formatDegree(degree);
      const roman = N === 7 ? romanNumeralForTriad(degree.number, q) : undefined;
      chords.push({
        degreeIndex: i,
        degreeText,
        roman,
        chordText: `${root.text}${suffix}`,
        quality: q,
      });
      continue;
    }

    const seventhIdx = mod(i + 6, N);
    const seventh = spelled.degrees[seventhIdx]?.note;
    if (!seventh) continue;
    const seventhInt = mod(seventh.pc - root.pc, 12);
    const q7 = seventhQuality(thirdInt, fifthInt, seventhInt);
    const suffix7 = qualitySuffix(q7);
    const degree = spelled.scale.degrees[i];
    const degreeText = formatDegree(degree);
    const triQ = triadQuality(thirdInt, fifthInt);
    const roman = N === 7 ? romanNumeralForTriad(degree.number, triQ) : undefined;
    chords.push({
      degreeIndex: i,
      degreeText,
      roman,
      chordText: `${root.text}${suffix7}`,
      quality: q7,
    });
  }

  return chords;
}

export type ModeInKeySignature = {
  modeName: string;
  scaleId: "major" | "dorian" | "phrygian" | "lydian" | "mixolydian" | "natural_minor" | "locrian";
  tonicText: string;
};

export function modesForMajorKeySignature(majorSpelled: SpelledScale): ModeInKeySignature[] {
  // Assumes majorSpelled is a 7-note major scale spelled with the desired key signature.
  if (majorSpelled.scale.degrees.length !== 7 || majorSpelled.degrees.length !== 7) return [];

  const modeDefs: Array<Pick<ModeInKeySignature, "modeName" | "scaleId">> = [
    { modeName: "Ionian", scaleId: "major" },
    { modeName: "Dorian", scaleId: "dorian" },
    { modeName: "Phrygian", scaleId: "phrygian" },
    { modeName: "Lydian", scaleId: "lydian" },
    { modeName: "Mixolydian", scaleId: "mixolydian" },
    { modeName: "Aeolian", scaleId: "natural_minor" },
    { modeName: "Locrian", scaleId: "locrian" },
  ];

  return modeDefs.map((m, i) => ({
    ...m,
    tonicText: majorSpelled.degrees[i]?.note.text ?? "",
  }));
}

