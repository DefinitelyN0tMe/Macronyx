# Changelog

All notable changes to Macronyx will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.4] - 2026-02-22 — "Trigger & Polish"

### Added
- **Pixel color trigger repeat mode** — new checkbox "Repeat while pixel matches" lets users choose between one-shot (fire once, wait for pixel to change and match again) or continuous repeat (re-fire after each playback completes while pixel still matches)
- **Schedule trigger presets** — expanded from 5 to 16 quick-fill buttons covering common intervals (1/5/10/15/30 min, 1/2/6 hours, daily times, weekdays, weekends, weekly, monthly)
- **Profile button animations** — Activate and Update buttons now show visual feedback with color flash, scale animation, and confirmation text ("Activated!" / "Updated!") on click

### Fixed
- **F11 double-play on Chains page** — pressing F11 on the Chains page fired both the chain player AND the global single-macro player simultaneously, causing double sound effects and playback glitching. AppShell's global hotkey handler now skips `playStart`/`playStop` when the active view is `chains`
- **Relative positioning not working** — three root causes: (1) case-sensitive process name comparison failed when casing differed between recording and playback, (2) cached active window returned Macronyx itself after user clicked Play instead of the target app, (3) no fallback matching. Fixed with case-insensitive comparison, forced fresh poll via `pollOnce()` when cached window doesn't match, and title-based fallback matching
- **Pixel color trigger fired every poll cycle** — one-shot pixel triggers now track their fired state and only re-fire after the pixel stops matching and matches again (unless repeat mode is enabled)

## [1.3.3] - 2026-02-22 — "Playback Stability"

### Added
- **Live playback settings** — profile auto-switch and manual profile activation now apply speed, humanize, and humanize amount changes immediately to the currently playing macro (no need to restart playback)

### Fixed
- **Pixel color trigger re-firing continuously** — pixel color triggers fired every polling cycle (1s) while the pixel matched, restarting playback every second and never completing the macro. Trigger-fired handler now checks if player or chain is already playing and silently skips — the trigger only fires again after the current playback finishes
- **Chain playback interrupted by triggers** — pixel color and other triggers could interrupt chain playback by calling `player.play()` directly, which stopped the current chain macro and caused state corruption. Both trigger-fired handler and PLAYBACK_START now reject play requests when a chain is active
- **Overlay widget idle during chain playback** — between macros in a chain, the overlay briefly showed "Idle" because the chain progress callback only updated overlay on idle. Now sends 'playing' status between chain steps to keep the overlay correct
- **F11 double-press in chain editor** — used React state (`isPlaying`) for the guard which could be stale during rapid keypresses. Replaced with a ref-based guard (`isPlayingRef`) that updates synchronously, eliminating the race condition
- **Profile auto-switch erased profile rules** — the `onSwitch` callback in profile auto-switcher overwrote settings without preserving global `profileRules`, erasing all auto-switch rules on first auto-switch. Now preserves rules the same way manual profile activation does

## [1.3.2] - 2026-02-22 — "Chain & Trigger Polish"

### Added
- **Pixel color picker** — "Pick from screen" button in pixel color triggers: hides the app, waits for the user to click anywhere on screen, captures both position (X, Y) and color automatically. No more manual coordinate/color entry
- **Chain playback settings** — speed, humanize, and repeat count settings now apply to chains. Repeat count repeats the entire chain cycle, not individual macros. Repeat delay between chain cycles is also supported

### Fixed
- **Recording pause included wait time** — pausing during recording included the pre-pause idle time (gap between last event and pressing pause) in the macro. Now resuming starts fresh — no "thinking time" leaks into the recorded macro
- **Profile rules erased on profile switch** — activating a profile overwrote profile auto-switch rules with the profile's saved rules (which were empty if created before rules were added). Rules are now preserved as global settings during profile activation
- **Chain F11 double-press crash** — pressing F11 again while a chain was playing caused state corruption and crashes. Added re-entry guard at both IPC and UI level — duplicate play requests are now silently ignored
- **Widget showed Idle during chain playback** — overlay widget only tracked the first macro in a chain, then showed "Idle" for subsequent ones. Added per-macro progress forwarding so the widget stays updated throughout the entire chain
- **Playback settings ignored by chains** — speed, humanize, and repeat count had no effect during chain playback. Chain player now applies global playback settings to each macro in the chain

## [1.3.1] - 2026-02-22 — "Playback Intelligence" (Hotfix)

### Added
- **Profile management UI** — new "Profiles" tab in Settings to create, switch, rename, update, and delete settings profiles; shows active profile with green indicator
- **Hotkey hints on Chain Editor** — shows F11 Play, F12 Stop, Esc Emergency Stop badges
- **Cron schedule presets** — quick-fill buttons for common schedules (Every 5 min, Every hour, Daily 9:00, Mon-Fri 8:30, Every 15 min)
- **Cron format help** — detailed field explanations with ranges and syntax reference in the schedule trigger editor

### Fixed
- **Playback not replaying + EPIPE crash** — ActiveWindowService, PixelSampler, and Player all shared the same PowerShell process; concurrent `sendQuery()` (marker-based stdout parsing) and `sendFireAndForget()` (write-only stdin) on the same process caused command corruption, silently dropped playback commands, and EPIPE crashes when the process died. **Fix: created a dedicated query process** (`query-process.ts`) for Active Window and Pixel Color queries, completely isolating them from the input simulator used by the Player. Added EPIPE error handling to `sendFireAndForget()` and `sendCommand()` with `stdin.on('error')` handler to prevent uncaught exceptions
- **Chain playback immediately stopping** — Chain Editor's `isPlaying` state was set to `false` immediately after the `playChain()` IPC call returned (IPC returns immediately, chain plays async in background). Fixed with bidirectional `appStatus` sync — `isPlaying` now tracks the global status correctly
- **Recording continued during pause** — added belt-and-suspenders guard in `addEvent()` that blocks new events when `isPaused` is true
- **Nested conditional logic broken** — entering a nested IF inside a skipped outer branch incorrectly evaluated the inner condition and flipped the skip state. Rewrote condition stack with per-entry `outerSkipped`/`branchSkipping` tracking so nested conditions inside skipped branches are fully skipped without evaluation
- **Triggers not registering after macro update** — `MACRO_UPDATE` handler only called `reloadTriggers()` without stopping/restarting the trigger manager; new triggers were never activated. Fixed with full stop→reload→start cycle
- **Hotkey trigger used text input** — replaced manual text input with press-to-record `HotkeyInput` component for trigger hotkeys
- **Chain Editor hotkey listener leak** — `useEffect` had no dependency array, re-registering the listener on every render. Refactored with `useCallback` + proper deps, and `getState()` to avoid stale closures
- **Chain Editor `appStatus` field missing** — referenced `s.appStatus` on the store (undefined) instead of `s.status`, breaking the isPlaying sync with global state
- **Profile activate not updating UI** — `PROFILE_ACTIVATE` IPC handler now sends `PROFILE_ACTIVATED` event to renderer so the settings store reloads

### Changed
- Window focus trigger editor shows per-matchType help text and improved placeholders
- Pixel color trigger shows polling frequency note
- Trigger Panel shows general info about enabling triggers in Settings
- Input simulator PowerShell process no longer includes Active Window / Pixel Color C# code (moved to dedicated query process)

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
