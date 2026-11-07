const { app, BrowserWindow, Menu, globalShortcut, shell } = require('electron');
const path = require('path');

// 关闭硬件加速兼容性问题时的退路：设置环境变量 APP_DISABLE_GPU=1 可软件渲染启动
if (process.env.APP_DISABLE_GPU === '1') {
  app.disableHardwareAcceleration();
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: '#0b1016',
    title: '地震震害空间对比模拟器',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      webgl: true
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'www', 'index.html'));

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // 自检模式：SEIS_SMOKE=<png路径> 时启动后截图并退出，用于打包后验证渲染是否正常
  if (process.env.SEIS_SMOKE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          require('fs').writeFileSync(process.env.SEIS_SMOKE, img.toPNG());
          console.log('[SMOKE] saved');
        } catch (e) {
          console.log('[SMOKE] failed', e.message);
        }
        app.quit();
      }, 8000);
    });
  }

  // 禁止页面被拖到外部浏览器，保持应用内体验
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  win.on('closed', () => { win = null; });
}

app.whenReady().then(() => {
  createWindow();

  // F11 全屏 / Esc 退出全屏，方便答辩投影
  globalShortcut.register('F11', () => {
    if (win) win.setFullScreen(!win.isFullScreen());
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
