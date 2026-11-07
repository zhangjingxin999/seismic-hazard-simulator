// 自检截图：SMOKE_SCENE=house|hill|body|rs  SMOKE_OUT=路径  SMOKE_WAIT=毫秒
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const scene = process.env.SMOKE_SCENE || 'house';
const out = process.env.SMOKE_OUT || path.join(__dirname, '_smoke.png');
const wait = parseInt(process.env.SMOKE_WAIT || '7000', 10);
const mode = process.env.SMOKE_MODE || '';
const click = process.env.SMOKE_CLICK !== '0';
const mag = process.env.SMOKE_MAG || '';

app.disableHardwareAcceleration && process.env.SMOKE_SW === '1' && app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: parseInt(process.env.SMOKE_W || '1600', 10), height: parseInt(process.env.SMOKE_H || '950', 10), show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: false, offscreen: false }
  });
  win.webContents.on('console-message', (e, lvl, msg) => {
    if (lvl >= 2) console.log('[console]', msg);
  });
  win.webContents.on('render-process-gone', (e, d) => { console.log('CRASH', JSON.stringify(d)); app.exit(1); });

  const q = mag ? `?rs=1&mag=${mag}${mode ? '&mode=' + mode : ''}` : '';
  await win.loadFile(path.join(__dirname, 'www', 'index.html'), { search: q });
  await new Promise(r => setTimeout(r, 3500));

  try {
    if (scene === 'rs') {
      if (!q) await win.webContents.executeJavaScript(`document.getElementById('sceneRS').click(); true`);
      await new Promise(r => setTimeout(r, 2500));
      if (mode && !q) {
        await win.webContents.executeJavaScript(`document.querySelector('.rs-tab[data-mode="${mode}"]').click(); true`);
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      const id = { hill: 'sceneHill', body: 'sceneBody' }[scene];
      if (id) {
        await win.webContents.executeJavaScript(`document.getElementById('${id}').click(); true`);
        await new Promise(r => setTimeout(r, 700));
      }
      if (process.env.SMOKE_MAT) {
        await win.webContents.executeJavaScript(`document.querySelector('.mat-btn[data-mat="${process.env.SMOKE_MAT}"]').click(); true`);
        await new Promise(r => setTimeout(r, 500));
      }
      if (process.env.SMOKE_MAGPICK) {
        await win.webContents.executeJavaScript(`document.querySelector('.mag-btn[data-mag="${process.env.SMOKE_MAGPICK}"]').click(); true`);
        await new Promise(r => setTimeout(r, 200));
      }
      if (click) {
        await win.webContents.executeJavaScript(`document.getElementById('goBtn').click(); true`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  } catch (err) { console.log('EVAL ERR', err.message); }

  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG());
  console.log('SHOT', out);
  await new Promise(r => setTimeout(r, 300));
  app.exit(0);
});
