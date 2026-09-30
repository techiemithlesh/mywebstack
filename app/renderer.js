'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let stackRoot    = '';
let statusCache  = null;
let currentView  = 'dashboard';
let pollTimer    = null;
let isSwitching  = false;
let logSource    = 'activity';
let toastTimer   = null;

// ── View switching ────────────────────────────────────────────────────────────
window.showView = function (view, btn) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');

  currentView = view;

  if (view === 'php')      renderPhpList(statusCache);
  if (view === 'logs')     renderActiveLog();
  if (view === 'settings') loadSettingsUI();
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el   = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3400);
}

// ── HTML escape ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Activity log ──────────────────────────────────────────────────────────────
function appendLog(entry) {
  if (logSource !== 'activity') return;
  const el   = document.getElementById('log-console');
  const line = document.createElement('div');
  line.className = 'log-line ' + (entry.level || 'info');
  line.innerHTML = `<span class="log-ts">${entry.ts}</span><span class="log-text">${esc(entry.msg)}</span>`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

async function renderActiveLog() {
  const el = document.getElementById('log-console');
  if (logSource === 'activity') {
    el.innerHTML = '';
    const logs = await window.api.getLogs();
    logs.forEach(e => {
      const line = document.createElement('div');
      line.className = 'log-line ' + (e.level || 'info');
      line.innerHTML = `<span class="log-ts">${e.ts}</span><span class="log-text">${esc(e.msg)}</span>`;
      el.appendChild(line);
    });
    el.scrollTop = el.scrollHeight;
  } else {
    el.innerHTML = '<div class="log-line">Loading…</div>';
    const content = await window.api.readLogFile(logSource);
    if (!content) {
      el.innerHTML = `<div class="log-line" style="color:var(--text3)">Log file not found or empty.</div>`;
    } else {
      el.innerHTML = `<div class="log-line" style="user-select:text;white-space:pre">${esc(content)}</div>`;
      el.scrollTop = el.scrollHeight;
    }
  }
}

// ── Service card update ───────────────────────────────────────────────────────
function updateCard(name, info) {
  const card = document.getElementById('card-' + name);
  const pill = document.getElementById('pill-' + name);
  const text = document.getElementById('pill-' + name + '-text');
  if (!card) return;

  card.className = 'svc-card ' + (info.running ? 'running' : 'stopped');
  pill.className = 'status-pill '  + (info.running ? 'running' : 'stopped');

  if (info.running) {
    text.textContent = 'Running';
  } else if (!info.available) {
    text.textContent = 'Not installed';
  } else {
    text.textContent = 'Stopped';
  }

  document.getElementById('btn-start-' + name).disabled = info.running  || !info.available;
  document.getElementById('btn-stop-'  + name).disabled = !info.running || !info.available;
}

function setLoading(name) {
  const pill = document.getElementById('pill-' + name);
  const text = document.getElementById('pill-' + name + '-text');
  pill.className   = 'status-pill loading';
  text.textContent = 'Working…';
  document.getElementById('btn-start-' + name).disabled = true;
  document.getElementById('btn-stop-'  + name).disabled = true;
}

// ── PHP list ──────────────────────────────────────────────────────────────────
function renderPhpList(status) {
  const list = document.getElementById('php-list');
  if (!status || !status.phpVersions || status.phpVersions.length === 0) {
    list.innerHTML = `<div class="empty-state">
      No PHP versions found in <code>php/</code>.<br>
      Run <strong>setup.ps1</strong> to extract PHP packages.
    </div>`;
    return;
  }

  list.innerHTML = '';
  status.phpVersions.forEach(v => {
    const isActive = v.name === status.activePhp;
    const row = document.createElement('div');
    row.className = 'php-row' + (isActive ? ' active' : '');
    row.dataset.version = v.name;
    row.innerHTML = `
      <div class="php-radio"><div class="php-radio-dot"></div></div>
      <div class="php-icon-sm">PHP</div>
      <div class="php-info">
        <div class="php-info-name">PHP ${esc(v.version)}</div>
        <div class="php-info-sub">${esc(v.name)}</div>
      </div>
      ${isActive ? '<span class="php-badge">Active</span>' : ''}
    `;
    if (!isActive) {
      row.addEventListener('click', () => handlePhpSwitch(v.name));
    }
    list.appendChild(row);
  });
}

// ── Apply full status snapshot ────────────────────────────────────────────────
function applyStatus(status) {
  if (!status || status.error) return;
  statusCache = status;

  updateCard('apache', status.apache);
  updateCard('mysql',  status.mysql);

  // Port labels
  if (status.settings) {
    document.getElementById('apache-port-label').textContent =
      `HTTP Server · Port ${status.settings.apachePort || 80}`;
    document.getElementById('mysql-port-label').textContent =
      `Database · Port ${status.settings.mysqlPort || 3306}`;
  }

  // Active PHP on dashboard
  if (status.activePhp) {
    const ver = (status.activePhp.match(/(\d+\.\d+\.\d+)/) || [])[1] || status.activePhp;
    document.getElementById('php-name').textContent = 'PHP ' + ver;
    document.getElementById('php-sub').textContent  = status.activePhp;
  } else {
    document.getElementById('php-name').textContent = 'Not configured';
    document.getElementById('php-sub').textContent  = 'Run setup.ps1';
  }

  // Setup banner
  const banner = document.getElementById('setup-banner');
  banner.style.display = status.needsSetup ? '' : 'none';

  if (currentView === 'php') renderPhpList(status);
}

// ── Settings UI ───────────────────────────────────────────────────────────────
function loadSettingsUI() {
  if (!statusCache || !statusCache.settings) return;
  const s = statusCache.settings;
  document.getElementById('set-apache-port').value     = s.apachePort  || 80;
  document.getElementById('set-mysql-port').value      = s.mysqlPort   || 3306;
  document.getElementById('set-start-minimized').checked = !!s.startMinimized;
  document.getElementById('set-autostart').checked       = !!s.autoStartServices;
}

// ── Polling ───────────────────────────────────────────────────────────────────
async function poll() {
  const status = await window.api.getStatus();
  applyStatus(status);
}

function startPolling() {
  poll();
  pollTimer = setInterval(poll, 5000);
}

// ── Handlers ─────────────────────────────────────────────────────────────────
async function handleStart(name) {
  setLoading(name);
  const r = await window.api.startService(name);
  if (!r.success) toast(r.error, 'error');
  await poll();
}

async function handleStop(name) {
  setLoading(name);
  const r = await window.api.stopService(name);
  if (!r.success) toast(r.error, 'error');
  await poll();
}

async function handleStartAll() {
  setLoading('apache'); setLoading('mysql');
  document.getElementById('btn-start-all').disabled = true;
  await window.api.startAll();
  document.getElementById('btn-start-all').disabled = false;
  await poll();
}

async function handleStopAll() {
  setLoading('apache'); setLoading('mysql');
  document.getElementById('btn-stop-all').disabled = true;
  await window.api.stopAll();
  document.getElementById('btn-stop-all').disabled = false;
  await poll();
}

async function handlePhpSwitch(version) {
  if (isSwitching) return;
  isSwitching = true;
  document.querySelectorAll('.php-row').forEach(el => el.classList.add('switching'));
  toast(`Switching to PHP ${version}…`);
  const r = await window.api.switchPhp(version);
  isSwitching = false;
  if (r.success) {
    toast('PHP switched successfully!', 'success');
  } else {
    toast(r.error, 'error');
  }
  await poll();
}

async function handleSaveSettings() {
  const patch = {
    apachePort:        parseInt(document.getElementById('set-apache-port').value, 10) || 80,
    mysqlPort:         parseInt(document.getElementById('set-mysql-port').value, 10)  || 3306,
    startMinimized:    document.getElementById('set-start-minimized').checked,
    autoStartServices: document.getElementById('set-autostart').checked
  };
  await window.api.saveSettings(patch);
  toast('Settings saved.', 'success');
  await poll();
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  stackRoot = await window.api.getStackRoot();

  // Nav
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view, btn));
  });

  // Title bar
  document.getElementById('btn-minimize').addEventListener('click', () => window.api.minimize());
  document.getElementById('btn-hide').addEventListener('click',     () => window.api.hide());
  document.getElementById('btn-quit').addEventListener('click',     () => window.api.quit());

  // Service buttons
  document.getElementById('btn-start-apache').addEventListener('click', () => handleStart('apache'));
  document.getElementById('btn-stop-apache') .addEventListener('click', () => handleStop('apache'));
  document.getElementById('btn-start-mysql') .addEventListener('click', () => handleStart('mysql'));
  document.getElementById('btn-stop-mysql')  .addEventListener('click', () => handleStop('mysql'));
  document.getElementById('btn-start-all')   .addEventListener('click', handleStartAll);
  document.getElementById('btn-stop-all')    .addEventListener('click', handleStopAll);

  // Setup
  document.getElementById('btn-run-setup').addEventListener('click', async () => {
    const r = await window.api.openSetup();
    if (r && r.error) toast(r.error, 'error');
    else toast('Setup started in a new window.', 'success');
  });

  // Quick links
  document.getElementById('ql-localhost')   .addEventListener('click', () => window.api.openUrl('http://localhost'));
  document.getElementById('ql-phpmyadmin')  .addEventListener('click', () => window.api.openUrl('http://localhost/phpmyadmin'));
  document.getElementById('ql-www')         .addEventListener('click', () => window.api.openFolder(stackRoot + '\\www'));
  document.getElementById('ql-root')        .addEventListener('click', () => window.api.openFolder(stackRoot));

  // Log toolbar
  document.getElementById('log-source').addEventListener('change', e => {
    logSource = e.target.value;
    if (currentView === 'logs') renderActiveLog();
  });
  document.getElementById('btn-refresh-log').addEventListener('click', renderActiveLog);
  document.getElementById('btn-clear-log')  .addEventListener('click', () => {
    document.getElementById('log-console').innerHTML = '';
  });

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', handleSaveSettings);

  // Live log stream
  window.api.onLog(entry => {
    appendLog(entry);
  });

  // Load existing logs
  const logs = await window.api.getLogs();
  logs.forEach(appendLog);

  startPolling();
}

document.addEventListener('DOMContentLoaded', init);
