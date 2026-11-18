# Changelog

All notable changes to this project are documented here. Entries are derived from commit messages and grouped by type.

## [0.2.0](https://github.com/AngeloR/theory-tools/compare/v0.1.0...v0.2.0) (2026-11-18)


### Features

* **header:** move mode switch to header ([f159644](https://github.com/AngeloR/theory-tools/commit/f1596445cac2607bb58a752f35dca6b97491cdf4))
* install Novus by Pendo web SDK ([a959798](https://github.com/AngeloR/theory-tools/commit/a95979899afbc5102fe0fb7b617f30aefe772fc4))
* track modes_root_changed Pendo event in Modes Explorer ([d1a4e8e](https://github.com/AngeloR/theory-tools/commit/d1a4e8e2cc253616d376f3ca60d68bb4e3345f0b))
* **ui:** add side-rail circle layout ([d8c1d3e](https://github.com/AngeloR/theory-tools/commit/d8c1d3e00ba1165c99410e97f00239878b96ce3f))


### Bug Fixes

* **cof:** show degree-only labels ([26ed8ec](https://github.com/AngeloR/theory-tools/commit/26ed8ec0b771ae44b76bf167a5306269d6761b05))

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
