# Macronyx Roadmap

A living document outlining planned features, improvements, and long-term vision for Macronyx.

> **Legend:** S = Small (1-2 days) &middot; M = Medium (3-5 days) &middot; L = Large (1-2 weeks) &middot; XL = Extra Large (2+ weeks)

---

## v1.1 — "Polish & Support" *(current)*

| Feature | Description | Size | Status |
|---------|-------------|:----:|:------:|
| Fix FUNDING.yml | Remove GitHub Sponsors (not enrolled), keep Ko-fi only | S | Done |
| Ko-fi Donate button | Heart icon in sidebar, opens modal with Ko-fi link + PayPal QR | S | Done |
| Floating status widget | Small always-on-top overlay showing recording/playing status when minimized | M | Done |
| Settings toggle for widget | Enable/disable overlay widget in Settings > General | S | Done |
| Version bump to 1.1.0 | Update package.json and Settings display | S | Done |

---

## v1.2 — "Editor Power-Up"

| Feature | Description | Size |
|---------|-------------|:----:|
| Recording pause/resume | Pause mid-recording without stopping, continue from same point | M |
| Drag-and-drop events | Drag events on timeline to reorder and retime | M |
| Multi-event batch editing | Select multiple events, edit shared properties at once | M |
| Copy/paste events | Ctrl+C/V events within the timeline | S |
| Event grouping | Group related events into named "actions" | M |
| Auto-save + dirty flag | Warn on unsaved changes, periodic auto-save | S |
| Smart delay smoothing | Automatically smooth out irregular delays in recordings (moving average, min/max clamp, curve interpolation) | M |

---

## v1.3 — "Playback Intelligence"

| Feature | Description | Size |
|---------|-------------|:----:|
| Trigger-based macros | Start macros based on triggers: schedule (cron/timer), hotkey combos, window focus change, pixel color match | L |
| Profile auto-switch | Automatically switch settings profiles based on active application/window (detect foreground app) | M |
| Macro chaining | Run macros sequentially — macro A then B then C | M |
| Conditional logic | If/else branching in macros (check pixel color, window title, time of day) | L |
| Relative positioning mode | Record mouse positions relative to active window, not absolute screen coords | M |
| Playback preview | Visualize playback on MousePathPreview without actually moving the cursor | S |

---

## v1.4 — "Analytics & Insights"

| Feature | Description | Size |
|---------|-------------|:----:|
| Macro analytics | Dashboard with stats: play count, total time saved, success/failure rate, most-used macros, usage over time chart | L |
| Playback logging | Log each playback run with timestamps, errors, duration | M |
| Performance profiling | Measure timing accuracy vs expected, show drift analysis | M |
| Export analytics | Export stats as CSV/JSON | S |

---

## v2.0 — "Pro Features"

| Feature | Description | Size |
|---------|-------------|:----:|
| Light theme + theme picker | Light/dark/system theme with custom accent color | M |
| Auto-updater | Check for updates on launch, download and install via electron-updater | M |
| Macro marketplace / sharing | Export macros with metadata, share via link or file | L |
| Plugin system | Allow community extensions (custom event types, triggers, actions) | XL |
| Cloud sync | Sync macros and settings across machines (optional, via GitHub Gist or custom backend) | L |
| Advanced humanizer | ML-based humanization with natural mouse curves, realistic typing patterns, micro-pauses | L |
| Multi-monitor support | Record and play across multiple displays with monitor-aware positioning | M |
| Macro variables | Define variables (click_x, delay_ms) that can be changed per-run without editing the macro | M |

---

## Contributing

Have a feature idea? Open an issue on [GitHub](https://github.com/DefinitelyN0tMe/Macronyx/issues) with the **feature request** label.
