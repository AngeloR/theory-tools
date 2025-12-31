// src/lib/guitar.ts

// Standard tuning MIDI notes (low E2 to high E4):
// E2=40 A2=45 D3=50 G3=55 B3=59 E4=64
export const STANDARD_TUNING_MIDI = [64, 59, 55, 50, 45, 40]; // High E at top (index 0)

export function pitchClassFromMidi(midi: number): number {
    return ((midi % 12) + 12) % 12;
}

export function pitchClassAt(stringIndex: number, fret: number): number {
    const open = STANDARD_TUNING_MIDI[stringIndex];
    return pitchClassFromMidi(open + fret);
}

export const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
export const DOUBLE_INLAY_FRETS = new Set([12, 24]);