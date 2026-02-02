# Changelog

All notable changes to this project are documented here. Entries are derived from commit messages and grouped by type.

## 0.1.0 - 2026-01-30
### Added
- Persist fretboard snapshots across sessions.
- Snapshot support: capture read-only fretboard copies with titles and delete controls.

### Changed
- Run the Vite dev server from this worktree.

### Added
- Snapshot support wired into the main fretboard without changing existing behavior.
- Modes functionality.
- Display chord voicings in CAGED positions.
- Circle of fifths wheel as the scale selector controls.
- Save selections.
- Theory agent system prompt.
- Better mobile support.
- Allow access to the server via Tailscale hostname.
- Added scales and modes: diminished, whole tone, altered, Lydian dominant, Lydian augmented, Dorian flat 2, Locrian, Mixolydian, Lydian, Phrygian, Dorian, blues, minor pentatonic, major pentatonic.
- Initial project setup.

### Changed
- Improve CAGED note selection algorithm.
- Move tuning reset control to the lower right of the fretboard.
- Clean up fretboard tuning configuration and UX.
- Clean up circle of fifths information for clearer chord relationships.
- Move docs into the docs directory.
- Desktop UI cleanup.
- Improve theory accuracy.
- Cleaned up degree map.

### Fixed
- Fix background height.
