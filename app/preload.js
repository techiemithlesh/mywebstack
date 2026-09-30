'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStatus:     ()        => ipcRenderer.invoke('get-status'),
  getLogs:       ()        => ipcRenderer.invoke('get-logs'),
  getStackRoot:  ()        => ipcRenderer.invoke('get-stack-root'),
  getSettings:   ()        => ipcRenderer.invoke('get-settings'),
  saveSettings:  (patch)   => ipcRenderer.invoke('save-settings', patch),

  startService:  (name)    => ipcRenderer.invoke('start-service', name),
  stopService:   (name)    => ipcRenderer.invoke('stop-service',  name),
  startAll:      ()        => ipcRenderer.invoke('start-all'),
  stopAll:       ()        => ipcRenderer.invoke('stop-all'),

  switchPhp:     (ver)     => ipcRenderer.invoke('switch-php', ver),

  readLogFile:   (type)    => ipcRenderer.invoke('read-log-file', type),
  openSetup:     ()        => ipcRenderer.invoke('open-setup'),
  openUrl:       (url)     => ipcRenderer.invoke('open-url',    url),
  openFolder:    (folder)  => ipcRenderer.invoke('open-folder', folder),

  minimize:  () => ipcRenderer.send('window-minimize'),
  hide:      () => ipcRenderer.send('window-hide'),
  quit:      () => ipcRenderer.send('quit-app'),

  onLog: cb => {
    const fn = (_, e) => cb(e);
    ipcRenderer.on('log', fn);
    return () => ipcRenderer.removeListener('log', fn);
  }
});
