# Building MyWebStack App

The GUI is an [Electron](https://www.electronjs.org/) app that lives in `app/`.
It produces two distributable artefacts:

| Target     | File                                  | Use case                              |
|------------|---------------------------------------|---------------------------------------|
| `nsis`     | `dist/MyWebStack-Setup-1.0.0.exe`    | Full installer with shortcuts/uninstall |
| `portable` | `dist/MyWebStack-Portable-1.0.0.exe` | Single EXE, copy anywhere             |

---

## Prerequisites

- **Windows 10 / 11** (x64)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **Git** (to clone the repo)

---

## Development (run without building)

```bash
cd app
npm install
npm start
```

The app loads from source and looks for your stack in the parent folder (`../`).

> **Electron download fails?**  
> If `npm install` errors with a download failure, the `.npmrc` in `app/` already points at a
> mirror. Alternatively set the env var before installing:
> ```powershell
> $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
> npm install
> ```

---

## Build a distributable

```bash
cd app
npm install
npm run build          # builds both NSIS installer + portable EXE
npm run build:installer   # installer only
npm run build:portable    # portable EXE only
```

Output lands in `dist/` at the repo root.

---

## Adding an icon (required for builds)

electron-builder needs `.ico` files. Convert `assets/icon.svg` to `assets/icon.ico` — use any
online converter (e.g. [cloudconvert.com](https://cloudconvert.com)) with sizes 16, 32, 48, 64,
128, 256. Copy the same file as `assets/tray-icon.ico` (or make a 16 × 16 variant).

The app launches fine without icons in development. Builds will warn but still succeed if the
icon file is absent.

---

## Project structure

```
app/
├── main.js          Main process — service management, IPC, tray
├── preload.js       Context bridge — secure renderer ↔ main IPC
├── index.html       UI shell + embedded CSS design system
├── renderer.js      Frontend — polling, event wiring, view logic
├── installer.nsh    NSIS post-install hooks (create dirs, README)
├── package.json     Electron + electron-builder config
├── .npmrc           npm settings (Electron download mirror)
└── assets/
    ├── icon.svg          Vector source
    ├── icon.ico          Windows icon for app & installer (you provide)
    └── tray-icon.ico     System-tray icon (you provide)
```

---

## What the installer does

1. Installs the app to the user-chosen directory (default: `%LOCALAPPDATA%\MyWebStack`)
2. Creates a Desktop shortcut and Start-menu entry
3. Creates `packages\` with a `README.txt` explaining which ZIP files to place there
4. Creates empty `apache\`, `mysql\`, `php\`, `phpmyadmin\`, `logs\` directories
5. Includes an uninstaller

After installation the user runs **setup.ps1** once (or clicks "Run Setup" inside the app) to
extract Apache, PHP, MySQL from the packages they downloaded.

---

## Contributing

See the root [CONTRIBUTING.md](../CONTRIBUTING.md). For app-specific work:

```bash
git checkout development
git checkout -b feature/app-your-feature
cd app && npm install
# edit → test with npm start → commit
git commit -m "feat(app): your change"
git push origin feature/app-your-feature
# PR → base: development
```
