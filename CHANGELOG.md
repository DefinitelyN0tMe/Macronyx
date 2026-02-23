# Changelog

All notable changes to Macronyx will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-02-23

### Added
- **Reset Analytics button** — "Clear All Data" button on the Overview tab with confirmation prompt; clears all playback logs and refreshes the dashboard

### Fixed
- **Macro played in infinite loop** — `defaultRepeatCount: 0` (corrupted by earlier settings bug) caused infinite playback. Clamped repeat count to minimum 1 in playback handler; settings UI now enforces min=1
- **Chain pause not reflected in overlay widget** — PLAYBACK_PAUSE only paused the underlying player, not the chain player. Now routes pause/resume through `chainPlayer` when a chain is active, so `chainPlayer.isPaused` is set correctly and the chain doesn't advance to the next macro while paused
- **Overlay widget too tall** — reduced window height from 58px to 40px; progress bar now uses column flex layout (no absolute positioning gap)
- **Chain resumed after pause during inter-step/repeat delay** — added pause-wait loops before each macro start and after chain repeat delays
- **Stale pause state on chain start** — `playbackPaused` is now reset to `false` when starting a new chain
- **Emergency stop left stale counters on overlay** — success/fail counters now reset on Escape

## [1.6.0] - 2026-02-23 — "Smart Targeting & Analytics"

### Added
- **Analytics Dashboard** — replaced the simple welcome page with a full analytics dashboard featuring three tabs: Overview, Per-Macro, and Performance. Shows aggregate stats (total plays, time saved, success rate, active macros), 14-day usage bar chart, top macros by play count, and recent activity
- **Playback Logging** — every playback run is now persistently logged to disk with timestamps, success/fail counts, trigger source, and per-event timing data. Logs survive app restarts and are capped at 500 entries per macro
- **Performance Profiling** — timing drift analysis for each playback run. Shows mean/P95/max drift, accuracy percentage, sparkline chart of drift per event, and drift distribution histogram. Helps identify timing bottlenecks
- **Per-Macro Analytics** — drill down into any macro's playback history with run-by-run stats, success rate donut chart, average duration, and last run timestamp
- **Export Analytics** — export all playback logs as CSV or JSON via save dialog from the Overview tab
- **Relative Positioning v2** — re-enabled with reliability fixes. Window detection now iterates all matching processes and picks the largest visible window (handles Chrome, VS Code, and other multi-process apps). Process name comparison is case-insensitive. Window cache TTL extended to 1000ms during playback
- **Event Inspector: Relative Position panel** — collapsible panel in event inspector shows process name, X/Y offsets, window dimensions at recording time, and window title for events recorded with relative positioning

### Changed
- Dashboard restructured: Quick Actions and Hotkey Reference retained at top, analytics tabs below, recent macros at bottom
- Analytics store (`analyticsStore.ts`) manages aggregate data, per-macro logs, and tab state via Zustand
- Charts are pure CSS + SVG (bar chart, donut chart, sparkline) — no external charting dependencies
- Analytics refresh automatically after each playback completion via AppShell listener
- `FindWindowByProcessName` C# method upgraded to handle multi-window apps by iterating all processes and selecting the window with the largest area
- Process names normalized to lowercase in recorder for consistent matching

## [1.5.0] - 2026-02-23 — "UI Refresh"

### Added
- **Preview control bar** — full play/pause/stop buttons, seek scrubber, time display, and speed selector (0.25x–4x) below the mouse path visualizer. Replaces the old overlay-only play/stop buttons
- **Timeline playhead** — red playhead line with triangle marker syncs with preview playback position in real-time. Uses the existing `.timeline-playhead` CSS that was previously unused
- **Preview pause/resume** — pause the animated preview at any point, seek to a specific timestamp with the scrubber, then resume. Preview speed is independent of macro playback speed
- **Overlay progress bar** — thin color-coded progress bar at the bottom of the overlay widget during playback, showing elapsed vs total duration
- **Sidebar Mantine Tooltips** — replaced native `title` tooltips with styled Mantine `<Tooltip>` components with arrows and smooth transitions. First Mantine component adoption
- **Focus-visible outlines** — global cyan outline on keyboard-focused elements for accessibility
- **ARIA attributes** — `role="navigation"` on sidebar, `aria-current="page"` on active nav, `role="status"` + `aria-live="polite"` on playback results, `role="img"` + `aria-label` on canvas

### Changed
- Visualizer canvas height increased from 160px to 220px for better visibility
- Preview state migrated from local React `useState` to Zustand store (`isPreviewPlaying`, `isPreviewPaused`, `previewElapsedMs`, `previewSpeed`) for cross-component sync
- Preview elapsed time now drives Timeline `playheadMs` automatically via `setPreviewElapsedMs → setPlayheadMs` chain
- Canvas bezier rendering improved with proper midpoint-based smoothing technique
- Added screen boundary indicator (subtle dashed rectangle) to visualizer canvas
- Overlay widget height increased from 52px to 58px to accommodate progress bar
- Overlay font-family aligned with main app (added `'Inter'` prefix)
- Sidebar background changed from hardcoded `#0d1117` to CSS variable `var(--bg-surface)`
- Status colors centralized in `STATUS_COLORS` constant in `src/shared/constants.ts` — replaces 3+ copies of hardcoded hex values across TitleBar, overlay, and editor
- Save button in editor toolbar now keyboard-focusable (removed `tabIndex={-1}`)

## [1.4.1] - 2026-02-23

### Fixed
- **Mouse curves barely visible** — curve movement total duration was capped at 60ms (too fast to perceive). Increased timing range to 40–250ms so bezier curves are clearly visible during playback
- **Overlay widget not showing statuses reliably** — overlay only appeared when the main window was minimized/hidden. Rewrote show/hide logic to be status-driven: overlay now auto-shows during any active state (recording/playing/paused) regardless of main window visibility, and auto-hides when idle with main window visible
- **Ctrl+Z / Ctrl+Y not working in editor** — undo/redo keyboard shortcuts were displayed in UI hints but never wired up in the Timeline keydown handler. Added Ctrl+Z (undo), Ctrl+Y and Ctrl+Shift+Z (redo) bindings
- **Relative Positioning removed from UI** — feature remains non-functional after multiple fix attempts (v1.3.3–v1.3.5). Removed the toggle from Settings entirely; code stays intact for future v1.6 rework. Default remains `false`

### Changed
- Roadmap restructured: old v1.5 "Smart Targeting & Analytics" moved to v1.6; new v1.5 "UI Refresh" added with editor, overlay, library, settings, and accessibility improvements
- Relative Positioning added to v1.6 roadmap as experimental feature for future rework

## [1.4.0] - 2026-02-23 — "Smart Playback"

### Added
- **Window-Aware Smart Scaling** — mouse coordinates are now proportionally scaled when the target window changes size since recording. Extends relative positioning so macros adapt to resized windows, not just moved ones
- **Success/Fail Visual Playback Markers** — each event during playback now gets a status (success/failed/skipped). Green/red/gray dots appear on timeline events after playback. Post-playback summary panel shows counts and duration. Overlay widget shows live success counter during playback
- **Natural Mouse Curve Editor** — bezier-based mouse movement with configurable curvature, overshoot, and speed profile (constant/ease-in-out/natural). Replaces linear point-to-point movement for more human-like cursor paths. Per-macro setting via "Curves" button in editor toolbar
- **Playback Report IPC** — new `playback:eventResult` and `playback:report` IPC channels for per-event results and post-playback reports
- **PlaybackResultsPanel** — new component showing post-playback summary with pass/fail/skip counts and duration

### Changed
- Relative Positioning marked as **(Experimental)** in Settings UI — feature is functional but frozen for further development
- MousePathPreview now renders smooth bezier curves instead of straight lines
- Player tracks `lastMousePos` for curve generation between mouse events
- Window bounds cache now stores width/height for proportional scaling
- `executeEvent()` returns `EventResultStatus` for result tracking

### Fixed
- **Trigger-fired playback overlay counts accumulated** — overlay success/fail counter was not reset when a trigger started new playback, causing counts to accumulate across trigger-fired sessions. Now resets counters and tracks results per trigger playback
- **Timeline render performance** — result status lookup used O(n) `indexOf` per event chip, causing O(n²) rendering for large macros. Replaced with pre-computed O(1) index map

## [1.3.5] - 2026-02-22 — "Relative Positioning Upgrade"

### Fixed
- **Relative positioning completely reworked** — previous implementation relied on `GetForegroundWindow()` which always returned Macronyx during playback. Now uses .NET `Process.GetProcessesByName()` + `MainWindowHandle` to find the target window by process name regardless of which window is focused. Window bounds are cached and refreshed every 500ms (instead of querying per-event), eliminating playback lag. Cross-platform: Linux uses `xdotool search`, macOS uses `osascript` process lookup.

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
