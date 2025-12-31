# Theory Engine Specification

## Root Selection

Users explicitly choose the root spelling.

Supported spellings include:

- Naturals: C D E F G A B
- Sharps: C♯ D♯ F♯ G♯ A♯
- Flats: D♭ E♭ G♭ A♭ B♭
- Edge spellings: C♭, F♭, E♯, B♯

Keys like **C♯ major** and **C♭ major** must be allowed.

## Degree Representation

- Degrees are displayed numerically: `1 2 3 4 5 6 7`
- Alterations are shown explicitly: `♭3`, `♯4`, etc.
- Interval names (m3, P5, etc.) are **not** shown
- Scales may be variable-length

## Scale Definitions

Each scale is defined by:

- Degree list (with alterations)
- Semitone offsets relative to root

Example:

- Major: `1 2 3 4 5 6 7`
- Natural minor: `1 2 ♭3 4 5 ♭6 ♭7`
- Harmonic minor: `1 2 ♭3 4 5 ♭6 7`
- Melodic minor (jazz): `1 2 ♭3 4 5 6 7`

## Diatonic Spelling Rules

- Spelling must follow diatonic letter progression
- Accidentals are applied to match pitch class
- Accidentals are capped at **single ♯ or ♭ only**

### Respelling Policy

- Double sharps/flats are not allowed
- If required:
  - Respelling is allowed on a per-note basis
  - Correct pitch + readability take priority
  - Root spelling chosen by the user is never silently changed

## Output of Theory Engine

The engine produces:

- A list of `(degree → spelled note)`
- A mapping from pitch class → degree index
- Canonical spelling for display on fretboard
