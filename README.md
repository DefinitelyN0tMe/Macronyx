<div align="center">

# MACRONYX

**Cross-platform macro recorder for gamers and power users**

Record and replay mouse movements, clicks, scroll, and keyboard input with precision.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub release](https://img.shields.io/github/v/release/DefinitelyN0tMe/Macronyx)](https://github.com/DefinitelyN0tMe/Macronyx/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/DefinitelyN0tMe/Macronyx/total)](https://github.com/DefinitelyN0tMe/Macronyx/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/DefinitelyN0tMe/Macronyx/build.yml?branch=main)](https://github.com/DefinitelyN0tMe/Macronyx/actions)

[Download](#download) | [Features](#features) | [Usage](#usage) | [Build](#build-from-source) | [Roadmap](ROADMAP.md) | [Contributing](#contributing)

</div>

---

## Features

### Recording
- Record mouse movement, clicks (left/right/middle), and scroll wheel
- Record keyboard input with key hold duration support
- **Pause/resume recording** — pause mid-recording without stopping, continue from the same point
- Configurable mouse sampling rate (8ms-100ms)
- Selective capture — toggle mouse, keyboard, or scroll independently
- Real-time event counter and timer during recording
- DPI-aware capture — works correctly on high-DPI / scaled displays

### Playback
- Adjustable playback speed (0.25x to 4x)
- Loop playback with configurable repeat count (or infinite loop)
- Configurable delay between loop iterations
- Pause/resume playback
- Humanization mode — adds natural variance to timing and positions
- DPI-aware playback — pixel-perfect cursor positioning on any display scaling

### Timeline Editor
- Visual timeline with separate mouse and keyboard tracks
- **Multi-select** — Ctrl+click to toggle, Shift+click for range select, Ctrl+A to select all
- **Drag-and-drop** events on the timeline to reposition them in time
- **Copy/paste** events with Ctrl+C / Ctrl+V
- **Event grouping** — assign events to named groups with colored timeline bands
- **Batch editing** — select multiple events and offset time, scale delays, or assign groups at once
- Event inspector panel with editable properties (timestamp, position, key, delay)
- **Smart delay smoothing** — moving-average smoothing with configurable window size and min/max clamping
- Mouse path visualization canvas showing recorded cursor trajectory
- **Auto-save** with dirty flag indicator and unsaved changes warning on navigation
- Undo/redo support for all operations
- Zoom and scroll navigation

### Automation & Triggers
- **Trigger-based macros** — start macros automatically based on:
  - **Hotkey combo** — press-to-record custom key combinations
  - **Schedule** — cron-based scheduling with quick presets (every 5 min, hourly, daily, weekdays)
  - **Window focus** — auto-play when a specific app gains focus (match by process name, title substring, or regex)
  - **Pixel color** — auto-play when a pixel at (X,Y) matches a target color within tolerance
- **Conditional logic (IF/ELSE/END)** — branch macro execution based on runtime checks:
  - Pixel color at a position
  - Active window title (contains, equals, regex)
  - Time of day (after/before)
  - Supports nesting (IF inside IF)
- **Macro chaining** — run macros in sequence (A → B → C) with configurable delays between steps; drag-to-reorder, per-step enable/disable
- **Relative positioning** — record mouse coordinates relative to the active window so macros adapt when windows move or resize
- **Playback preview** — animated cursor visualization on the mouse path canvas without moving the real cursor

### Profiles
- **Settings profiles** — save snapshots of your current settings as named profiles; switch between them to quickly change configurations
- **Profile auto-switch** — automatically activate a settings profile when a specific application gains focus (configure rules by process name, window title, or regex)
- Create, rename, update, and delete profiles from Settings → Profiles tab

### Macro Library
- Save and organize recorded macros
- Search macros by name, description, or tags
- Import/export macros in `.macronyx` format
- Grid and list view modes
- Select a macro for hotkey-based playback

### System Integration
- Global hotkeys work even when the app is not focused:
  | Action | Default Hotkey |
  |--------|---------------|
  | Start recording | `F9` |
  | Stop recording | `F10` |
  | Pause / Resume | `Shift+F9` |
  | Start playback | `F11` |
  | Stop playback | `Shift+F11` |
  | Emergency stop | `Escape` |
- **Floating overlay widget** — always-on-top status indicator showing recording/playback state, elapsed time, and total duration (shows above fullscreen apps)
- **Notification sounds** — audio feedback for record, stop, pause, resume, and playback actions
- System tray — minimize to tray and control via hotkeys
- All hotkeys are fully customizable in Settings
- **Multi-monitor support** — correct cursor positioning across all displays

### Cross-Platform
| Platform | Installer | Portable / Standalone |
|----------|-----------|----------------------|
| Windows  | `.exe` setup | `.exe` portable |
| macOS    | `.dmg` | `.zip` |
| Linux    | `.deb` | `.AppImage` |

---

## Download

**[Download Latest Release](https://github.com/DefinitelyN0tMe/Macronyx/releases/latest)**

> **Windows users**: choose `macronyx-*-setup.exe` for the installer or `macronyx-*-portable.exe` for a single-file portable version.

---

## 🎬 Macronyx in Action

<p align="center">
  <img src="assets/overview.gif" alt="Macronyx overview" width="900">
</p>

<p align="center">
  <img src="assets/recording.gif" alt="Recording macro" width="900">
</p>

<p align="center">
  <img src="assets/editor.gif" alt="Timeline editor and library" width="900">
</p>

## Usage

### Quick Start

1. Open Macronyx
2. Go to the **Recorder** tab
3. Press `F9` (or click the record button) to start recording
4. Perform your actions — move the mouse, click, scroll, type
5. Press `F10` to stop recording
6. Your macro appears in the **Library** automatically
7. Select a macro and press `F11` to play it back

### Editing Macros

1. Open a macro from the **Library** and click **Edit**
2. Click events on the **Timeline** to select them (Ctrl+click for multi-select, Shift+click for range)
3. Drag events to reposition them, or use Ctrl+C / Ctrl+V to copy/paste
4. Use the **Event Inspector** to adjust timestamps, positions, delays, and keys
5. Select multiple events for batch editing — offset time, scale delays, or assign to groups
6. Use **Smooth Delays** to clean up irregular timing in recordings
7. View the cursor path on the **Mouse Path Preview** canvas
8. Undo/Redo for safe editing — all operations are undoable
9. Changes auto-save every 60 seconds, or click **Save** manually

### Triggers & Automation

1. Open a macro in the **Editor** and switch to the **Triggers** tab
2. Click **"+ Add"** and choose a trigger type:
   - **Hotkey combo** — press the key combination you want to use
   - **Schedule** — enter a cron expression or click a quick preset
   - **Window focus** — set a match type (process/title contains/title regex) and value
   - **Pixel color** — set X, Y coordinates, target color, and tolerance
3. Toggle the trigger ON and **Save** the macro
4. Enable triggers globally in **Settings → General → Enable Triggers**

### Conditional Logic (IF/ELSE/END)

1. Open a macro in the **Editor → Timeline** tab
2. Click the green **"+ IF"** button in the toolbar
3. Select the **IF** event on the timeline → configure the condition in the **Event Inspector**:
   - **Pixel color**: check if pixel at (X,Y) matches a target color
   - **Window title**: check if the foreground window matches a pattern
   - **Time of day**: check if the current time is within a range
4. Place events between **IF** and **ELSE** (executed when condition is **true**)
5. Place events between **ELSE** and **END** (executed when condition is **false**)
6. Conditions can be nested (IF inside IF)

### Macro Chains

1. Go to the **Chains** page from the sidebar
2. Click **"+ New Chain"** to create a chain
3. Add macros to the chain from the dropdown; drag to reorder
4. Set delay between steps (ms), toggle steps on/off
5. Press **Play** or use the **F11** hotkey to run the chain

### Profiles

1. Go to **Settings → Profiles** tab
2. Enter a name and click **"Save Current as Profile"** to snapshot your current settings
3. Click **Activate** on any profile to switch to its settings
4. **Double-click** a profile name to rename it, or use the ✏ button
5. To auto-switch profiles based on the foreground app, enable **Auto-Switch Profiles** in Settings → General and add rules

### Silent Mode

1. Enable **Minimize to Tray** in Settings > General
2. Close the window — Macronyx keeps running in the system tray
3. Use global hotkeys to control recording and playback without the window

### Portable Mode

1. Download the portable `.exe`
2. Launch it, go to **Settings > Advanced** and click **Enable** next to Portable Mode
3. Restart the app — settings and macros are now stored in a `data/` subfolder next to the executable
4. Move the entire folder to a USB drive for on-the-go use

> You can also enable portable mode manually by creating an empty file named `portable` (no extension) next to the exe.

---

## Build from Source

### Requirements

- Node.js 20+
- npm 9+
- Git

#### Linux additional packages

```bash
sudo apt install libx11-dev libxtst-dev libpng-dev
```

### Build

```bash
git clone https://github.com/DefinitelyN0tMe/Macronyx.git
cd Macronyx
npm install
npm run dev          # Development mode with hot reload
npm run build        # Build for production
npm run build:win    # Package for Windows
npm run build:mac    # Package for macOS
npm run build:linux  # Package for Linux
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron + electron-vite |
| Frontend  | React 19 + TypeScript |
| UI        | Mantine v7 |
| State     | Zustand |
| Input Capture | uiohook-napi |
| Input Simulation | Platform-native (SendInput / xdotool / CGEvent) |
| Packaging | electron-builder |

---

## Platform Notes

### Windows
- No special permissions required
- Works with any DPI scaling (100%-300%+)
- Multi-monitor support with virtual screen coordinate mapping
- Input simulation uses Win32 `SendInput` API for reliable, DPI-aware playback

### macOS
- Requires **Accessibility** permissions: System Settings > Privacy & Security > Accessibility
- On first launch, right-click > Open to bypass Gatekeeper

### Linux
- Requires X11 (`libx11-dev`, `libxtst-dev`)
- On Wayland, the X11 compatibility layer (XWayland) may be needed
- AppImage: run `chmod +x Macronyx-*.AppImage` before launching

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and the development timeline.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## Support Development

If you find Macronyx useful, consider supporting the developer:

<a href="https://ko-fi.com/definitelyforme">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support on Ko-fi" />
</a>

---

## Disclaimer

Macronyx is a transparent automation tool designed for productivity, accessibility, and personal use. It does not include any stealth, hidden, or surveillance functionality. Users are responsible for complying with the terms of service of any software they use Macronyx with.

---

<div align="center">
  Made with care by <a href="https://github.com/DefinitelyN0tMe">DefinitelyN0tMe</a>
</div>
