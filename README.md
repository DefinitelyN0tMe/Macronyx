<div align="center">

# MACRONYX

**Cross-platform macro recorder for gamers and power users**

Record and replay mouse movements, clicks, scroll, and keyboard input with precision.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub release](https://img.shields.io/github/v/release/DefinitelyN0tMe/Macronyx)](https://github.com/DefinitelyN0tMe/Macronyx/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/DefinitelyN0tMe/Macronyx/total)](https://github.com/DefinitelyN0tMe/Macronyx/releases)

[Download](#download) | [Features](#features) | [Usage](#usage) | [Build](#build-from-source) | [Contributing](#contributing)

</div>

---

## Features

**Recording**
- Record mouse movement, clicks (left/right/middle), and scroll wheel
- Record keyboard input with key hold duration support
- Configurable mouse sampling rate (8ms-100ms)
- Selective capture (toggle mouse/keyboard/scroll independently)
- Real-time event counter and timer during recording

**Playback**
- Adjustable playback speed (0.25x to 4x)
- Loop playback with configurable repeat count
- Delay between loop iterations
- Pause/resume playback
- Humanization mode — adds natural variance to timing and positions

**Timeline Editor**
- Visual timeline with separate mouse and keyboard tracks
- Click to select and edit individual events
- Event inspector panel with editable properties (timestamp, position, key)
- Mouse path visualization canvas showing recorded cursor trajectory
- Undo/redo support
- Zoom and scroll controls

**Macro Library**
- Save and organize recorded macros
- Search macros by name, description, or tags
- Import/export macros in `.macronyx` format
- Grid and list view modes

**System Integration**
- Global hotkeys work even when the app is not focused
  - `F9` Start recording
  - `F10` Stop recording
  - `F11` Start playback
  - `Shift+F11` Stop playback
  - `Escape` Emergency stop
- System tray with silent mode — minimizes and stays out of the way
- All hotkeys are fully customizable

**Cross-Platform**
- Windows (installer + portable)
- macOS (DMG + ZIP)
- Linux (AppImage + DEB)
- Portable mode — runs from USB drive, stores data alongside the executable

---

## Download

Download the latest release for your platform:

**[Latest Release](https://github.com/DefinitelyN0tMe/Macronyx/releases/latest)**

| Platform | Installer | Portable |
|----------|-----------|----------|
| Windows  | `.exe` setup | `.exe` portable |
| macOS    | `.dmg` | `.zip` |
| Linux    | `.deb` | `.AppImage` |

---

## Usage

### Quick Start

1. Open Macronyx
2. Go to **Recorder** tab
3. Click the red record button (or press `F9`)
4. Perform your actions — move mouse, click, type
5. Click stop (or press `F10`)
6. Your macro is saved automatically in the Library
7. Select a macro and press `F11` to play it back

### Editing Macros

1. Open a macro from the **Library**
2. Click **Edit** to open the **Timeline Editor**
3. Click events on the timeline to inspect and edit them
4. Adjust timestamps, positions, and delays
5. Use Undo/Redo for safe editing
6. Click **Save** when done

### Silent Mode

1. Enable **Minimize to Tray** in Settings > General
2. When you close the window, Macronyx stays in the system tray
3. Use global hotkeys to control recording/playback without the window

### Portable Mode

1. Create a file named `portable` (no extension) next to the Macronyx executable
2. Macronyx will store all data in a `data/` folder next to the executable
3. Perfect for USB drives

---

## Build from Source

### Requirements

- Node.js 20+
- npm 9+
- Git

### Linux additional requirements

```bash
sudo apt install libx11-dev libxtst-dev libpng-dev
```

### Steps

```bash
git clone https://github.com/DefinitelyN0tMe/Macronyx.git
cd Macronyx
npm install
npm run dev        # Development mode
npm run build      # Build for production
npm run build:win  # Package for Windows
npm run build:mac  # Package for macOS
npm run build:linux # Package for Linux
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron + electron-vite |
| Frontend  | React 19 + TypeScript |
| UI        | Mantine v7 (dark theme) |
| State     | Zustand |
| Input Capture | uiohook-napi |
| Packaging | electron-builder |

---

## Permissions

- **macOS**: Macronyx requires Accessibility permissions to record and replay input. Go to System Settings > Privacy & Security > Accessibility and add Macronyx.
- **Linux**: May require `libx11-dev` and `libxtst-dev`. On Wayland, X11 compatibility layer may be needed.
- **Windows**: No special permissions required.

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
