# Changelog

All notable changes to Macronyx will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-21 — "Playback Intelligence"

### Added
- **Trigger-based macros** — start macros automatically via hotkey combos, cron schedules, window focus changes, or pixel color matches
- **Profile auto-switch** — automatically activate a settings profile when a specific application gains focus (match by process name, window title, or regex)
- **Macro chaining** — run macros sequentially (A → B → C) with configurable delays between steps; drag-to-reorder, per-step enable/disable
- **Conditional logic** — if/else branching inside macros based on pixel color, window title, or time of day; flat event model with nesting support
- **Relative positioning mode** — record mouse coordinates relative to the active window so macros adapt when windows move or resize
- **Playback preview** — animated cursor visualization on the mouse path canvas without moving the real cursor; shows click flashes, key labels, and a progress bar
- **Active Window Service** — cross-platform polling service (Win32 GetForegroundWindow, xdotool, osascript) that detects foreground window changes
- **Pixel Color Sampling** — cross-platform pixel reader (Win32 GetPixel, ImageMagick, screencapture) for trigger and condition evaluation
- **Chain Editor UI** — dedicated sidebar view for creating and managing macro chains with step reordering and playback controls
- **Trigger Panel** — per-macro trigger configuration with editors for all four trigger types (hotkey recorder, cron input, window matcher, pixel picker)
- **Condition Inspector** — inline editor for condition events: pixel color picker with tolerance, window title pattern, and time-of-day range
- Settings toggles: Enable Triggers, Auto-Switch Profiles, Relative Positioning
- Profile auto-switch rules table in Settings (profile picker, match type, match value)
- "Chains" navigation item in sidebar
- "+ IF" toolbar button in editor for inserting condition blocks
- Timeline/Triggers tab switcher in editor
- Logic track on timeline for condition events (IF/ELSE/END badges)

### Changed
- Emergency stop now also halts chain playback and trigger-fired macros
- Player supports conditional branch evaluation and relative position resolution during playback
- Recorder attaches window-relative offsets when relative positioning is enabled
- HotkeyManager extended with dynamic trigger hotkey registration

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
