// src/lib/music.ts

export type Letter = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type Acc = -1 | 0 | 1; // single accidental cap
export type DegreeAlt = -1 | 0 | 1;

export type Degree = { number: number; alt: DegreeAlt }; // variable length scales supported

export type ScaleDef = {
    id: string;
    name: string;
    degrees: Degree[];      // e.g. 1 2 b3 4 5 b6 b7
    semitones: number[];    // relative to root pc
};

export type SpelledNote = {
    letter: Letter;
    acc: Acc;
    pc: number;     // 0..11
    text: string;   // e.g. "E♯" / "B♭"
};

const LETTER_TO_PC: Record<Letter, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
};

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

export const SCALES: ScaleDef[] = [
    {
        id: "major_pentatonic",
        name: "Major Pentatonic",
        degrees: [
            { number: 1, alt: 0 },
            { number: 2, alt: 0 },
            { number: 3, alt: 0 },
            { number: 5, alt: 0 },
            { number: 6, alt: 0 },
        ],
        semitones: [0, 2, 4, 7, 9],
    },
    {
        id: "minor_pentatonic",
        name: "Minor Pentatonic",
        degrees: [
            { number: 1, alt: 0 },
            { number: 3, alt: -1 },
            { number: 4, alt: 0 },
            { number: 5, alt: 0 },
            { number: 7, alt: -1 },
        ],
        semitones: [0, 3, 5, 7, 10],
    },
    {
        id: "major",
        name: "Major",
        degrees: [
            { number: 1, alt: 0 },
            { number: 2, alt: 0 },
            { number: 3, alt: 0 },
            { number: 4, alt: 0 },
            { number: 5, alt: 0 },
            { number: 6, alt: 0 },
            { number: 7, alt: 0 },
        ],
        semitones: [0, 2, 4, 5, 7, 9, 11],
    },
    {
        id: "natural_minor",
        name: "Natural Minor",
        degrees: [
            { number: 1, alt: 0 },
            { number: 2, alt: 0 },
            { number: 3, alt: -1 },
            { number: 4, alt: 0 },
            { number: 5, alt: 0 },
            { number: 6, alt: -1 },
            { number: 7, alt: -1 },
        ],
        semitones: [0, 2, 3, 5, 7, 8, 10],
    },
    {
        id: "harmonic_minor",
        name: "Harmonic Minor",
        degrees: [
            { number: 1, alt: 0 },
            { number: 2, alt: 0 },
            { number: 3, alt: -1 },
            { number: 4, alt: 0 },
            { number: 5, alt: 0 },
            { number: 6, alt: -1 },
            { number: 7, alt: 0 },
        ],
        semitones: [0, 2, 3, 5, 7, 8, 11],
    },
    {
        id: "melodic_minor",
        name: "Melodic Minor (Jazz)",
        degrees: [
            { number: 1, alt: 0 },
            { number: 2, alt: 0 },
            { number: 3, alt: -1 },
            { number: 4, alt: 0 },
            { number: 5, alt: 0 },
            { number: 6, alt: 0 },
            { number: 7, alt: 0 },
        ],
        semitones: [0, 2, 3, 5, 7, 9, 11],
    },
];

// Display helpers
export function formatDegree(d: Degree): string {
    const prefix = d.alt === -1 ? "♭" : d.alt === 1 ? "♯" : "";
    return `${prefix}${d.number}`;
}

export function formatNoteText(letter: Letter, acc: Acc): string {
    const sym = acc === -1 ? "♭" : acc === 1 ? "♯" : "";
    return `${letter}${sym}`;
}

// Root parsing: "Cb", "C#", "Db", "E#", "Fb", "B#", etc.
export function parseRoot(root: string): SpelledNote {
    const trimmed = root.trim();
    const ch0 = trimmed[0]?.toUpperCase();
    if (!ch0) throw new Error(`Bad root: ${root}`);
    if (!/^[A-G]$/.test(ch0)) throw new Error(`Bad root: ${root}`);

    const letter = ch0 as Letter;
    // Important: C maps to pitch class 0, so we must not use a falsy check here.
    if (!(letter in LETTER_TO_PC)) throw new Error(`Bad root: ${root}`);

    let acc: Acc = 0;
    const rest = trimmed.slice(1);
    if (rest === "") acc = 0;
    else if (rest === "b" || rest === "♭") acc = -1;
    else if (rest === "#" || rest === "♯") acc = 1;
    else throw new Error(`Bad root: ${root}`);

    const pc = mod12(LETTER_TO_PC[letter] + acc);
    return { letter, acc, pc, text: formatNoteText(letter, acc) };
}

function mod12(n: number) {
    return ((n % 12) + 12) % 12;
}

function diatonicLetterFrom(rootLetter: Letter, degreeNumber: number): Letter {
    // degreeNumber: 1-based
    const rootIndex = LETTERS.indexOf(rootLetter);
    const idx = (rootIndex + (degreeNumber - 1)) % 7;
    return LETTERS[idx];
}

// Single-accidental spelling solver:
// Prefer diatonic letter if possible with acc -1/0/+1.
// If not possible (would require double accidental), "respell where needed":
// pick any single-accidental spelling matching pc, preferring naturals, then sharps, then flats.
function diatonicDistance(a: Letter, b: Letter): number {
    const ia = LETTERS.indexOf(a);
    const ib = LETTERS.indexOf(b);
    if (ia < 0 || ib < 0) return 7;
    const d = Math.abs(ia - ib);
    return Math.min(d, 7 - d);
}

function scoreCandidateRelative(expected: Letter, rootAcc: Acc, n: SpelledNote): number {
    // lower = better
    // 1) stay as close as possible to the expected diatonic letter
    // 2) prefer naturals, then whichever accidental matches the key flavor (sharp vs flat), then the opposite
    const letterPenalty = diatonicDistance(expected, n.letter) * 10;

    if (n.acc === 0) return letterPenalty + 0;

    // Key-flavor preference: sharp keys prefer sharps, flat keys prefer flats, naturals slightly prefer sharps (common readability)
    const prefer: Acc = rootAcc === -1 ? -1 : 1;
    const accidentalPenalty = n.acc === prefer ? 1 : 2;
    return letterPenalty + accidentalPenalty;
}

function spellPitchClassPrefer(expectedLetter: Letter, targetPc: number, rootAcc: Acc): SpelledNote {
    const base = LETTER_TO_PC[expectedLetter];

    for (const acc of [0, 1, -1] as Acc[]) {
        if (mod12(base + acc) === targetPc) {
            return { letter: expectedLetter, acc, pc: targetPc, text: formatNoteText(expectedLetter, acc) };
        }
    }

    // fallback: choose any letter+acc (single accidental) that matches targetPc
    // prefer diatonic closeness, then naturals, then "key-flavor" accidentals (sharp/flat).
    const candidates: SpelledNote[] = [];
    for (const L of LETTERS) {
        const b = LETTER_TO_PC[L];
        for (const a of [0, 1, -1] as Acc[]) {
            if (mod12(b + a) === targetPc) {
                candidates.push({ letter: L, acc: a, pc: targetPc, text: formatNoteText(L, a) });
            }
        }
    }
    candidates.sort((x, y) => scoreCandidateRelative(expectedLetter, rootAcc, x) - scoreCandidateRelative(expectedLetter, rootAcc, y));
    return candidates[0] ?? { letter: expectedLetter, acc: 0, pc: targetPc, text: formatNoteText(expectedLetter, 0) };
}

export type SpelledScale = {
    root: SpelledNote;
    scale: ScaleDef;
    degrees: { degree: Degree; note: SpelledNote }[];
    // Map pitch class to the degree index (for fretboard coloring/labeling)
    pcToDegreeIndex: Map<number, number>;
};

export function spellScale(rootText: string, scale: ScaleDef): SpelledScale {
    const root = parseRoot(rootText);
    const degrees: { degree: Degree; note: SpelledNote }[] = [];

    const pcToDegreeIndex = new Map<number, number>();

    scale.degrees.forEach((deg, i) => {
        const targetPc = mod12(root.pc + scale.semitones[i]);
        const expectedLetter = diatonicLetterFrom(root.letter, deg.number);
        const spelled = spellPitchClassPrefer(expectedLetter, targetPc, root.acc);
        degrees.push({ degree: deg, note: spelled });

        // If collisions ever happen in later exotic scales, keep first (stable).
        if (!pcToDegreeIndex.has(targetPc)) pcToDegreeIndex.set(targetPc, i);
    });

    return { root, scale, degrees, pcToDegreeIndex };
}