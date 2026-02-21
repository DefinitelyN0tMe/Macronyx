# Changelog

All notable changes to Macronyx will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-02-21 — "Editor Power-Up"

### Added
- **Recording pause/resume** — pause mid-recording without stopping, continue from the same point
- Configurable Toggle Pause hotkey (default `Shift+F9`) for both recording and playback
- **Multi-select** in timeline editor — Ctrl+click to toggle, Shift+click for range, Ctrl+A for all
- **Batch editing** panel — offset timestamps, scale delays, assign groups, bulk delete
- **Drag-and-drop** events on the timeline to reposition them in time
- **Copy/paste** events with Ctrl+C / Ctrl+V
- **Event grouping** — assign events to named groups with colored timeline bands
- **Smart delay smoothing** — moving-average smoothing with configurable window and min/max clamping
- **Auto-save** every 60 seconds with dirty flag indicator and unsaved changes warning
- **Overlay widget** now shows elapsed / total duration during playback
- **Notification sounds** for record/stop/pause/resume/play actions (Web Audio synthesis)
- **Multi-monitor support** — correct coordinate mapping across all displays using virtual screen metrics
- Hotkey hints on every page (Dashboard, Recorder, Library, Editor)
- Editing keyboard shortcut hints (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Z, Del)

### Fixed
- Recording timer/duration mismatch — renderer timer now syncs to main process elapsed time
- Recording delays included pause duration, causing incorrect playback timing
- Overlay widget not showing above browser and fullscreen apps (now uses screen-saver z-level)
- Stuck keys during playback pause — player now releases held keys on pause, restores on resume
- Stuck Shift key causing cascading windows from macros recorded with hotkey pause
- Overlay widget timer restarting from zero after pause/resume
- Overlay widget not showing pause status during playback pause
- Event count resetting when navigating away from recorder page
- Hotkey-initiated pause/resume not updating timer state
- Emergency stop not fully resetting all state
- Click accuracy: atomic move+click via single SendInput batch prevents race conditions

### Changed
- Default pause hotkey from F12 to Shift+F9 (F12 blocked by OS on Windows)
- Resume cooldown reduced from 200ms to 120ms to prevent dropping real user events
- Playback pause/stop now responds within 50ms even during long delays

## [1.1.0] - 2025-02-20 — "Polish & Support"

### Added
- **Donate button** — heart icon in sidebar opens modal with Ko-fi link and PayPal QR
- **Floating status widget** — small always-on-top overlay showing recording/playing status
- Settings toggle to enable/disable the overlay widget (Settings > General)
- FUNDING.yml for GitHub Sponsors / Ko-fi

### Changed
- Fixed FUNDING.yml to use Ko-fi only (removed GitHub Sponsors placeholder)

## [1.0.0] - 2025-02-20

### Added
- Record mouse movement, clicks, scroll, and keyboard input
- Replay macros with adjustable speed (0.25x - 4x)
- Loop playback with configurable repeat count and delay
- Global hotkeys for recording and playback control (F9-F12)
- Emergency stop hotkey (Escape)
- Timeline-based macro editor with drag-and-drop
- Event inspector for editing individual event properties
- Mouse path visualization canvas
- Undo/redo support in the editor
- Macro library with search functionality
- Import/export macros (.macronyx format)
- System tray with silent mode
- Playback humanization (timing and position randomization)
- Customizable settings (recording, playback, hotkeys, general)
- Profile system for different configurations
- Portable mode support
- Dark gamer theme with cyan/violet accents
- Cross-platform support (Windows, macOS, Linux)
