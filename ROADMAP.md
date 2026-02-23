# Macronyx Roadmap

A living document outlining planned features, improvements, and long-term vision for Macronyx.

> **Legend:** S = Small (1-2 days) &middot; M = Medium (3-5 days) &middot; L = Large (1-2 weeks) &middot; XL = Extra Large (2+ weeks)

---

## v1.1 — "Polish & Support" *(released)*

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Fix FUNDING.yml | Remove GitHub Sponsors (not enrolled), keep Ko-fi only | S | Done |
| Ko-fi Donate button | Heart icon in sidebar, opens modal with Ko-fi link + PayPal QR | S | Done |
| Floating status widget | Small always-on-top overlay showing recording/playing status when minimized | M | Done |
| Settings toggle for widget | Enable/disable overlay widget in Settings > General | S | Done |
| Version bump to 1.1.0 | Update package.json and Settings display | S | Done |

---

## v1.2 — "Editor Power-Up" *(released)*

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Recording pause/resume | Pause mid-recording without stopping, continue from same point | M | Done |
| Drag-and-drop events | Drag events on timeline to reorder and retime | M | Done |
| Multi-event batch editing | Select multiple events, edit shared properties at once | M | Done |
| Copy/paste events | Ctrl+C/V events within the timeline | S | Done |
| Event grouping | Group related events into named "actions" with colored timeline bands | M | Done |
| Auto-save + dirty flag | Warn on unsaved changes, periodic auto-save, navigation guard | S | Done |
| Smart delay smoothing | Moving-average smoothing with configurable window size and min/max clamp | M | Done |
| Notification sounds | Audio feedback for record/stop/pause/resume/play (Web Audio synthesis) | S | Done |
| Multi-monitor support | Correct coordinate mapping across all displays (virtual screen metrics) | M | Done |
| Atomic click accuracy | Single-batch SendInput for move+click to guarantee correct position | S | Done |
| Overlay playback info | Widget shows elapsed / total duration, works above fullscreen apps | S | Done |
| Hotkey hints | All pages show relevant hotkey badges and editing shortcuts | S | Done |

---

## v1.3 — "Playback Intelligence" *(released — v1.3.5)*

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Trigger-based macros | Start macros based on triggers: schedule (cron/timer), hotkey combos, window focus change, pixel color match | L | Done |
| Profile auto-switch | Automatically switch settings profiles based on active application/window (detect foreground app) | M | Done |
| Macro chaining | Run macros sequentially — macro A then B then C | M | Done |
| Conditional logic | If/else branching in macros (check pixel color, window title, time of day) | L | Done |
| Playback preview | Visualize playback on MousePathPreview without actually moving the cursor | S | Done |
| Profile management UI | Create/switch/rename/delete settings profiles from Settings → Profiles tab | M | Done |
| v1.3.1–v1.3.5 hotfixes | Playback regression, nested conditionals, trigger reload, chain hotkeys, pause recording | M | Done |

---

## v1.4 — "Smart Playback" *(released — v1.4.1)*

Smarter, more reliable, and more realistic playback — reports playback health and moves the mouse naturally.

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Success/Fail Visual Playback Markers | Per-event success/failed/skipped status during playback, overlay counter, timeline indicators, and post-playback summary | M | Done |
| Natural Mouse Curve Editor | Bezier-based mouse movement with curvature, overshoot, and speed profile settings; replaces linear point-to-point movement | M | Done |
| v1.4.1 hotfixes | Curve visibility, overlay reliability, Ctrl+Z binding, remove broken relative positioning | S | Done |

---

## v1.5 — "UI Refresh"

Modernize and polish the interface — better editor experience, improved overlay widget, and overall UX enhancements.

| Feature | Description | Size |
|---------|-------------|:----:|
| Editor UI overhaul | Redesign the timeline editor layout for better usability — improved track layout, event chip styling, better visual hierarchy, cleaner toolbar | L |
| Overlay widget redesign | New overlay widget with richer status display, smoother animations, compact/expanded modes, and improved positioning | M |
| Library & navigation polish | Improved sidebar navigation, better macro card design, smoother view transitions, and responsive layout improvements | M |
| Settings UI improvements | Cleaner settings layout with better grouping, visual feedback, and inline help | S |
| Accessibility & keyboard nav | Consistent focus states, keyboard navigation through all views, better contrast ratios | M |

---

## v1.6 — "Smart Targeting & Analytics"

Visual targeting that doesn't depend on coordinates, plus a full analytics dashboard.

| Feature | Description | Size |
|---------|-------------|:----:|
| Relative Positioning v2 | Experimental — record mouse positions relative to the active window with reliable window detection across multi-monitor setups. Includes Window-Aware Smart Scaling for proportional coordinate mapping when windows resize | L |
| Visual UI Anchors | Image region matching to find UI elements regardless of window position/size — replaces coordinate-based targeting | L-XL |
| Macro Analytics Dashboard | Stats: play count, total time saved, success/failure rate, most-used macros, usage over time chart | L |
| Playback Logging | Log each playback run with timestamps, errors, duration (extends v1.4 markers) | M |
| Performance Profiling | Measure timing accuracy vs expected, show drift analysis | M |
| Export Analytics | Export stats as CSV/JSON | S |

---

## v2.0 — "Pro Features"

| Feature | Description | Size |
|---------|-------------|:----:|
| Light theme + theme picker | Light/dark/system theme with custom accent color | M |
| Auto-updater | Check for updates on launch, download and install via electron-updater | M |
| Macro marketplace / sharing | Export macros with metadata, share via link or file | L |
| Plugin system | Allow community extensions (custom event types, triggers, actions) | XL |
| Cloud sync | Sync macros and settings across machines (optional, via GitHub Gist or custom backend) | L |
| Multi-monitor enhancements | Per-monitor DPI awareness, monitor-relative recording mode, display layout changes | M |
| Macro variables | Define variables (click_x, delay_ms) that can be changed per-run without editing the macro | M |

---

## Contributing

Have a feature idea? Open an issue on [GitHub](https://github.com/DefinitelyN0tMe/Macronyx/issues) with the **feature request** label.
