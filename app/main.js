'use strict';

const {
  app, BrowserWindow, ipcMain, Tray, Menu,
  shell, nativeImage, dialog
} = require('electron');
const path    = require('path');
const fs      = require('fs');
const net     = require('net');
const { execFile, spawn } = require('child_process');
const util    = require('util');

const execFileAsync = util.promisify(execFile);

// ── Paths ─────────────────────────────────────────────────────────────────────

const STACK_ROOT = app.isPackaged
  ? path.dirname(process.execPath)
  : path.join(__dirname, '..');

let mainWindow = null;
let tray       = null;
let logBuffer  = [];
let settings   = {};

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

// ── Settings ──────────────────────────────────────────────────────────────────

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }
  } catch { /* ignore */ }
  settings = Object.assign({
    apachePort:    80,
    mysqlPort:     3306,
    startMinimized: false,
    autoStartServices: false,
    theme: 'dark'
  }, settings);
}

function saveSettings() {
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8'); }
  catch { /* ignore */ }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function addLog(msg, level = 'info') {
  const ts    = new Date().toLocaleTimeString('en-GB');
  const entry = { ts, msg, level };
  logBuffer.push(entry);
  if (logBuffer.length > 500) logBuffer.shift();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log', entry);
  }
}

// ── File utilities ────────────────────────────────────────────────────────────

function findFileIn(root, filename, depth = 5) {
  if (!fs.existsSync(root) || depth === 0) return null;
  try {
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
      const full = path.join(root, e.name);
      if (e.isFile() && e.name.toLowerCase() === filename.toLowerCase()) return full;
      if (e.isDirectory()) {
        const found = findFileIn(full, filename, depth - 1);
        if (found) return found;
      }
    }
  } catch { /* skip */ }
  return null;
}

// ── Stack path discovery ──────────────────────────────────────────────────────

function getStackPaths() {
  const apacheDir = path.join(STACK_ROOT, 'apache');
  const mysqlDir  = path.join(STACK_ROOT, 'mysql');
  const phpDir    = path.join(STACK_ROOT, 'php');

  const httpdExe = findFileIn(apacheDir, 'httpd.exe');
  const mysqlExe = findFileIn(mysqlDir,  'mysqld.exe');

  let apacheRoot = null, apacheConf = null;
  if (httpdExe) {
    apacheRoot = path.dirname(path.dirname(httpdExe));
    apacheConf = path.join(apacheRoot, 'conf', 'httpd.conf');
  }

  let mysqlRoot = null, mysqlConf = null;
  if (mysqlExe) {
    mysqlRoot = path.dirname(path.dirname(mysqlExe));
    mysqlConf = path.join(mysqlRoot, 'my.ini');
  }

  return { httpdExe, mysqlExe, apacheRoot, apacheConf, mysqlRoot, mysqlConf, phpDir };
}

// ── Port check ────────────────────────────────────────────────────────────────

function isPortInUse(port) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once('error', () => resolve(true));
    srv.once('listening', () => { srv.close(); resolve(false); });
    srv.listen(port, '127.0.0.1');
  });
}

// ── Process detection ─────────────────────────────────────────────────────────

async function isProcessRunningByPath(exePath) {
  if (!exePath || !fs.existsSync(exePath)) return false;
  const esc = exePath.replace(/\\/g, '\\\\').replace(/'/g, "''");
  const script = `
$p = Get-Process -ErrorAction SilentlyContinue | Where-Object {
  try { $_.Path -and ([IO.Path]::GetFullPath($_.Path) -ieq '${esc}') } catch { $false }
} | Select-Object -First 1
if ($p) { 'yes' } else { 'no' }`.trim();

  try {
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command', script
    ], { timeout: 8000 });
    return stdout.trim() === 'yes';
  } catch {
    return false;
  }
}

// ── Apache ────────────────────────────────────────────────────────────────────

async function startApache() {
  const { httpdExe, apacheRoot, apacheConf } = getStackPaths();
  if (!httpdExe)   throw new Error('httpd.exe not found. Run setup.ps1 first.');
  if (!fs.existsSync(apacheConf)) throw new Error('httpd.conf missing. Run setup.ps1 first.');

  if (await isProcessRunningByPath(httpdExe)) return 'already running';

  const root = apacheRoot.replace(/\\/g, '/');
  const conf = apacheConf.replace(/\\/g, '/');
  const exe  = httpdExe.replace(/'/g, "''");
  const cwd  = path.dirname(httpdExe).replace(/'/g, "''");

  const script = `
Start-Process -FilePath '${exe}' \`
  -ArgumentList @('-d','${root}','-f','${conf}') \`
  -WorkingDirectory '${cwd}' -WindowStyle Hidden
Start-Sleep -Seconds 2
$p = Get-Process -Name httpd -ErrorAction SilentlyContinue | Select-Object -First 1
if ($p) { 'started' } else { 'failed' }`.trim();

  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command', script
  ], { timeout: 15000 });

  if (stdout.trim() === 'failed') {
    const logFile = path.join(apacheRoot, 'logs', 'error.log');
    throw new Error(`Apache failed to start. Check: ${logFile}`);
  }
  return 'started';
}

async function stopApache() {
  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `$p = Get-Process -Name httpd -ErrorAction SilentlyContinue
     if ($p) { $p | Stop-Process -Force; 'stopped' } else { 'not running' }`
  ], { timeout: 8000 });
  return stdout.trim();
}

// ── MySQL ─────────────────────────────────────────────────────────────────────

async function startMySQL() {
  const { mysqlExe, mysqlConf } = getStackPaths();
  if (!mysqlExe) throw new Error('mysqld.exe not found. Run setup.ps1 first.');

  if (await isProcessRunningByPath(mysqlExe)) return 'already running';

  const exe  = mysqlExe.replace(/'/g, "''");
  const conf = mysqlConf.replace(/'/g, "''");
  const cwd  = path.dirname(mysqlExe).replace(/'/g, "''");

  const script = `
Start-Process -FilePath '${exe}' \`
  -ArgumentList @('--defaults-file=${conf}') \`
  -WorkingDirectory '${cwd}' -WindowStyle Hidden
Start-Sleep -Seconds 3
$p = Get-Process -Name mysqld -ErrorAction SilentlyContinue | Select-Object -First 1
if ($p) { 'started' } else { 'failed' }`.trim();

  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command', script
  ], { timeout: 20000 });

  if (stdout.trim() === 'failed') throw new Error('MySQL failed to start. Check data directory logs.');
  return 'started';
}

async function stopMySQL() {
  const { stdout } = await execFileAsync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `$p = Get-Process -Name mysqld -ErrorAction SilentlyContinue
     if ($p) { $p | Stop-Process -Force; 'stopped' } else { 'not running' }`
  ], { timeout: 8000 });
  return stdout.trim();
}

// ── PHP versions ──────────────────────────────────────────────────────────────

function getPhpVersions() {
  const { phpDir } = getStackPaths();
  if (!fs.existsSync(phpDir)) return [];

  return fs.readdirSync(phpDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const dir    = path.join(phpDir, e.name);
      const phpExe = path.join(dir, 'php.exe');
      if (!fs.existsSync(phpExe)) return null;

      const dlls = fs.readdirSync(dir).filter(f => /^php\d*apache2_4\.dll$/i.test(f));
      const dll  = dlls[0] ? path.join(dir, dlls[0]) : null;
      const ver  = (e.name.match(/(\d+\.\d+\.\d+)/) || [])[1] || e.name;

      return { name: e.name, version: ver, dir, phpExe, apacheDll: dll };
    })
    .filter(Boolean)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
}

function getActivePhpVersion() {
  const { apacheConf } = getStackPaths();
  if (!apacheConf || !fs.existsSync(apacheConf)) return null;

  const conf  = fs.readFileSync(apacheConf, 'utf8');
  const match = conf.match(/LoadModule\s+php\w*_module\s+"?([^"\r\n]+php\w*apache2_4\.dll)"?/i);
  if (!match) return null;

  const dllPath  = path.resolve(match[1].replace(/\//g, path.sep));
  const versions = getPhpVersions();
  const active   = versions.find(v =>
    v.apacheDll && path.resolve(v.apacheDll).toLowerCase() === dllPath.toLowerCase()
  );
  return active ? active.name : null;
}

async function switchPhpVersion(versionName) {
  const versions = getPhpVersions();
  const target   = versions.find(v => v.name === versionName);
  if (!target)           throw new Error(`PHP version "${versionName}" not found.`);
  if (!target.apacheDll) throw new Error(`Apache DLL not found for ${versionName}. Use a Thread Safe x64 build.`);

  const { apacheConf } = getStackPaths();
  if (!apacheConf || !fs.existsSync(apacheConf)) throw new Error('httpd.conf not found.');

  let conf = fs.readFileSync(apacheConf, 'utf8');

  const major      = parseInt((target.version.match(/^(\d+)/) || ['', '8'])[1]);
  const moduleName = major >= 8 ? 'php_module' : `php${major}_module`;
  const dllFwd     = target.apacheDll.replace(/\\/g, '/');
  const dirFwd     = target.dir.replace(/\\/g, '/');

  conf = conf.replace(/LoadModule\s+php\w*_module\s+"?[^\r\n]+"?/i, `LoadModule ${moduleName} "${dllFwd}"`);
  conf = conf.replace(/PHPIniDir\s+"?[^\r\n]+"?/i,                  `PHPIniDir "${dirFwd}"`);

  fs.writeFileSync(apacheConf, conf, 'utf8');

  await stopApache();
  await new Promise(r => setTimeout(r, 800));
  await startApache();

  return `Switched to PHP ${target.version}`;
}

// ── Log file reading ──────────────────────────────────────────────────────────

function readLogFile(filePath, maxLines = 200) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines   = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  } catch { return null; }
}

// ── Status snapshot ───────────────────────────────────────────────────────────

async function getStatus() {
  const { httpdExe, mysqlExe, apacheRoot, mysqlRoot } = getStackPaths();

  const [apacheRunning, mysqlRunning, apachePortBusy, mysqlPortBusy] = await Promise.all([
    httpdExe ? isProcessRunningByPath(httpdExe) : Promise.resolve(false),
    mysqlExe ? isProcessRunningByPath(mysqlExe) : Promise.resolve(false),
    isPortInUse(settings.apachePort || 80),
    isPortInUse(settings.mysqlPort  || 3306)
  ]);

  const apacheLogPath = apacheRoot ? path.join(apacheRoot, 'logs', 'error.log') : null;

  return {
    apache: { running: apacheRunning, available: !!httpdExe, portBusy: apachePortBusy },
    mysql:  { running: mysqlRunning,  available: !!mysqlExe, portBusy: mysqlPortBusy  },
    phpVersions: getPhpVersions(),
    activePhp:   getActivePhpVersion(),
    stackRoot:   STACK_ROOT,
    apacheLogPath,
    settings,
    needsSetup: !httpdExe || !mysqlExe
  };
}

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  const opts = {
    width:  940,
    height: 640,
    minWidth:  820,
    minHeight: 540,
    frame:           false,
    transparent:     false,
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false
    },
    show: false
  };
  if (fs.existsSync(iconPath)) opts.icon = iconPath;

  mainWindow = new BrowserWindow(opts);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (!settings.startMinimized) mainWindow.show();
  });

  mainWindow.on('close', e => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.ico');
  const icon     = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('MyWebStack');

  function rebuild() {
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open MyWebStack', click: () => { mainWindow.show(); mainWindow.focus(); } },
      { type: 'separator' },
      { label: 'Start All', click: async () => {
          try {
            addLog('Starting Apache…');
            await startApache(); addLog('Apache started.', 'success');
            addLog('Starting MySQL…');
            await startMySQL();  addLog('MySQL started.',  'success');
          } catch (e) { addLog(e.message, 'error'); }
          rebuild();
      }},
      { label: 'Stop All', click: async () => {
          try {
            await stopApache(); addLog('Apache stopped.');
            await stopMySQL();  addLog('MySQL stopped.');
          } catch (e) { addLog(e.message, 'error'); }
          rebuild();
      }},
      { type: 'separator' },
      { label: 'localhost',  click: () => shell.openExternal('http://localhost') },
      { label: 'phpMyAdmin', click: () => shell.openExternal('http://localhost/phpmyadmin') },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]));
  }

  rebuild();
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus());
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  createTray();
  addLog('MyWebStack ready.');
  addLog(`Stack root: ${STACK_ROOT}`);

  if (settings.autoStartServices) {
    startApache().then(() => addLog('Apache started (auto).', 'success')).catch(e => addLog(e.message, 'error'));
    startMySQL() .then(() => addLog('MySQL started (auto).',  'success')).catch(e => addLog(e.message, 'error'));
  }
});

app.on('window-all-closed', () => { /* keep alive in tray */ });

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.handle('get-status',     async ()          => { try { return await getStatus(); } catch (e) { return { error: e.message }; } });
ipcMain.handle('get-logs',       ()                => logBuffer);
ipcMain.handle('get-stack-root', ()                => STACK_ROOT);
ipcMain.handle('get-settings',   ()                => settings);

ipcMain.handle('save-settings', (_, patch) => {
  Object.assign(settings, patch);
  saveSettings();
  return { ok: true };
});

ipcMain.handle('start-service', async (_, name) => {
  try {
    addLog(`Starting ${name}…`);
    const r = name === 'apache' ? await startApache() : await startMySQL();
    addLog(`${name}: ${r}`, 'success');
    return { success: true, result: r };
  } catch (e) {
    addLog(`${name} error: ${e.message}`, 'error');
    return { success: false, error: e.message };
  }
});

ipcMain.handle('stop-service', async (_, name) => {
  try {
    addLog(`Stopping ${name}…`);
    const r = name === 'apache' ? await stopApache() : await stopMySQL();
    addLog(`${name}: ${r}`);
    return { success: true, result: r };
  } catch (e) {
    addLog(`${name} error: ${e.message}`, 'error');
    return { success: false, error: e.message };
  }
});

ipcMain.handle('start-all', async () => {
  const res = {};
  for (const svc of ['apache', 'mysql']) {
    try {
      addLog(`Starting ${svc}…`);
      res[svc] = await (svc === 'apache' ? startApache() : startMySQL());
      addLog(`${svc}: ${res[svc]}`, 'success');
    } catch (e) {
      addLog(`${svc}: ${e.message}`, 'error');
      res[svc] = `error: ${e.message}`;
    }
  }
  return res;
});

ipcMain.handle('stop-all', async () => {
  const res = {};
  for (const svc of ['apache', 'mysql']) {
    try {
      res[svc] = await (svc === 'apache' ? stopApache() : stopMySQL());
      addLog(`${svc}: ${res[svc]}`);
    } catch (e) {
      addLog(`${svc}: ${e.message}`, 'error');
      res[svc] = `error: ${e.message}`;
    }
  }
  return res;
});

ipcMain.handle('switch-php', async (_, version) => {
  try {
    addLog(`Switching PHP → ${version}…`);
    const r = await switchPhpVersion(version);
    addLog(r, 'success');
    return { success: true };
  } catch (e) {
    addLog(`PHP switch: ${e.message}`, 'error');
    return { success: false, error: e.message };
  }
});

ipcMain.handle('read-log-file', (_, type) => {
  const { apacheRoot, mysqlRoot } = getStackPaths();
  const paths = {
    apache: apacheRoot ? path.join(apacheRoot, 'logs', 'error.log')     : null,
    mysql:  mysqlRoot  ? path.join(mysqlRoot,  'data', 'error.log')     : null
  };
  return readLogFile(paths[type]);
});

ipcMain.handle('open-setup', async () => {
  const setupScript = path.join(STACK_ROOT, 'setup.ps1');
  if (!fs.existsSync(setupScript)) return { error: 'setup.ps1 not found.' };
  const ps = spawn('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', setupScript
  ], { detached: true, stdio: 'ignore' });
  ps.unref();
  return { ok: true };
});

ipcMain.handle('open-url',    (_, u) => shell.openExternal(u));
ipcMain.handle('open-folder', (_, p) => shell.openPath(p));

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-hide',     () => mainWindow?.hide());
ipcMain.on('quit-app',        () => { app.isQuitting = true; app.quit(); });
