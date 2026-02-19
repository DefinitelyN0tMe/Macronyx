# Contributing to Macronyx

Thanks for your interest in contributing!

## Development Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/DefinitelyN0tMe/Macronyx.git
   cd Macronyx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

- `src/main/` — Electron main process (recording engine, playback, storage, IPC)
- `src/preload/` — Preload bridge between main and renderer
- `src/renderer/` — React frontend (UI components, stores, hooks)
- `src/shared/` — Shared types and constants

## Branching

- `main` — stable release branch
- `dev` — development branch
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/issue-description`

## Pull Requests

1. Fork the repository
2. Create your feature branch from `dev`
3. Make your changes
4. Test on your platform
5. Submit a pull request

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Zustand for state management
- No `any` types unless absolutely necessary

## Reporting Issues

Please use the issue templates provided. Include:
- OS and version
- Macronyx version
- Steps to reproduce
- Expected vs actual behavior
