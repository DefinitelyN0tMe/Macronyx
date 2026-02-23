# Macronyx Roadmap

A living document outlining planned features, improvements, and long-term vision for Macronyx.

> **Legend:** S = Small (1-2 days) &middot; M = Medium (3-5 days) &middot; L = Large (1-2 weeks) &middot; XL = Extra Large (2+ weeks)

---

## Released

<details>
<summary><strong>v1.1 — "Polish & Support"</strong></summary>

| Feature | Size | Status |
|---------|:----:|:------:|
| Ko-fi Donate button with PayPal QR modal | S | Done |
| Floating always-on-top status widget | M | Done |
| Settings toggle for overlay widget | S | Done |

</details>

<details>
<summary><strong>v1.2 — "Editor Power-Up"</strong></summary>

| Feature | Size | Status |
|---------|:----:|:------:|
| Recording pause/resume | M | Done |
| Drag-and-drop timeline events | M | Done |
| Multi-event batch editing | M | Done |
| Copy/paste events (Ctrl+C/V) | S | Done |
| Event grouping with colored bands | M | Done |
| Auto-save + dirty flag + nav guard | S | Done |
| Smart delay smoothing | M | Done |
| Notification sounds (Web Audio) | S | Done |
| Multi-monitor support | M | Done |
| Atomic click accuracy (SendInput batch) | S | Done |
| Overlay elapsed/total timer | S | Done |

</details>

<details>
<summary><strong>v1.3 — "Playback Intelligence" (v1.3.0–v1.3.5)</strong></summary>

| Feature | Size | Status |
|---------|:----:|:------:|
| Trigger-based macros (hotkey, schedule, window focus, pixel color) | L | Done |
| Profile auto-switch by foreground app | M | Done |
| Macro chaining (A → B → C) | M | Done |
| Conditional logic (IF/ELSE/END) with nesting | L | Done |
| Playback preview (animated cursor) | S | Done |
| Profile management UI | M | Done |
| Five hotfix releases (v1.3.1–v1.3.5) | M | Done |

</details>

<details>
<summary><strong>v1.4 — "Smart Playback" (v1.4.0–v1.4.1)</strong></summary>

| Feature | Size | Status |
|---------|:----:|:------:|
| Success/Fail visual playback markers with overlay counter | M | Done |
| Natural mouse curves (bezier, overshoot, speed profiles) | M | Done |
| v1.4.1 hotfixes — curve visibility, overlay reliability, Ctrl+Z | S | Done |

</details>

<details>
<summary><strong>v1.5 — "UI Refresh"</strong></summary>

| Feature | Size | Status |
|---------|:----:|:------:|
| Preview control bar with seek, speed selector, timeline playhead | L | Done |
| Overlay widget redesign with progress bar | M | Done |
| Sidebar Mantine Tooltips + CSS variable cleanup | M | Done |
| Shared design system (STATUS_COLORS) | S | Done |
| Accessibility (focus-visible, ARIA attributes) | M | Done |

</details>

### v1.6 — "Smart Targeting & Analytics" *(current — v1.6.1)*

Window-aware playback that adapts to any screen layout, plus a full analytics dashboard to understand how your macros perform.

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Relative Positioning v2 | Record mouse positions relative to window — coordinates adapt when windows move or resize. Multi-process window detection (Chrome, VS Code, etc.) with proportional scaling | L | Done |
| Analytics Dashboard | Three-tab dashboard: Overview (stats, 14-day chart, top macros), Per-Macro (run history, success rate donut), Performance (drift analysis, sparkline, histogram) | L | Done |
| Playback Logging | Persistent per-run logs with timestamps, success/fail counts, trigger source, and per-event timing data. Capped at 500 entries per macro | M | Done |
| Performance Profiling | Timing drift analysis: mean/P95/max drift, accuracy %, sparkline chart, and drift distribution histogram per playback run | M | Done |
| Export & Reset Analytics | Export logs as CSV/JSON; clear all playback history with confirmation prompt | S | Done |
| Overlay Widget Compact | Reduced widget height (58px → 40px), column flex layout with flush progress bar | S | Done |
| Chain Pause/Resume | Proper pause routing through chain player — widget shows "Paused" correctly during chain playback | S | Done |

---

## Upcoming

### v1.7 — "Visual Targeting & Scripting"

The next major leap: move beyond coordinate-based automation toward visual, intent-based targeting — plus scriptable macros for advanced users.

| Feature | Description | Size |
|---------|-------------|:----:|
| Visual UI Anchors | Image-region matching to find UI elements regardless of window position or size. Template matching with configurable confidence threshold — replaces manual coordinate entry | XL |
| Anchor Recorder | During recording, auto-capture a screenshot region around each click target. Events reference anchors instead of raw (X, Y) coordinates | L |
| Anchor Inspector | Preview matched regions in the Event Inspector with confidence score, fallback to coordinates when no match found | M |
| Script Mode (beta) | Lua/JS scripting layer for advanced users — read/write variables, call playback functions, define custom logic beyond IF/ELSE | L |
| Macro Variables | Define named variables (e.g. `click_x`, `delay_ms`) that can be changed per-run via a dialog without editing the macro itself | M |

---

### v1.8 — "Collaboration & Quality of Life"

Sharing, better UX, and reliability improvements.

| Feature | Description | Size |
|---------|-------------|:----:|
| Auto-Updater | Check for updates on launch, download and install silently via electron-updater. Manual check in Settings | M |
| Macro Sharing | Export macros as self-contained `.macronyx` bundles with metadata, description, and screenshots. Import via drag-and-drop or file dialog | M |
| Undo/Redo in Recorder | Undo the last N recorded events in real-time during recording (backtrack without re-recording) | M |
| Light Theme + Theme Picker | Light/dark/system theme with custom accent color selection | M |
| Notification Center | In-app toast notifications for trigger fires, playback completion, errors, and update availability | S |
| Localization (i18n) | English, Russian, and community-contributed translations | M |

---

### v2.0 — "Pro Features"

The vision: Macronyx as a complete desktop automation platform.

| Feature | Description | Size |
|---------|-------------|:----:|
| Plugin System | Community extensions — custom event types, triggers, actions, and UI panels loaded via a plugin API | XL |
| Cloud Sync | Sync macros and settings across machines (optional — GitHub Gist or custom backend) | L |
| Macro Marketplace | Browse and install community-created macros and plugins from within the app | L |
| Multi-Monitor Enhancements | Per-monitor DPI awareness, monitor-relative recording mode, layout change detection | M |
| Recording Templates | Pre-built recording templates for common tasks (form filling, data entry, testing) | M |
| Headless Mode | CLI-only execution for server/CI environments — run macros without a GUI | M |
| REST API | Local HTTP server for external tool integration — trigger macros, read status, and control playback via API | M |

---

## Contributing

Have a feature idea? Open an issue on [GitHub](https://github.com/DefinitelyN0tMe/Macronyx/issues) with the **feature request** label. Pull requests are always welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
