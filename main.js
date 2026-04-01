const { app, BrowserWindow, globalShortcut } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Always load login page on startup
  mainWindow.loadURL("http://localhost:3000/login.html");

  // Log loading errors (for debugging)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    // Kill server process properly
    if (serverProcess) {
      try {
        if (process.platform === 'win32') {
          // On Windows, use taskkill to ensure process tree is killed
          spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
        } else {
          serverProcess.kill('SIGTERM');
        }
      } catch (err) {
        console.error('Error killing server process:', err);
      }
    }
  });
}

app.whenReady().then(() => {

  // Use absolute path to server.js
  // When asar is disabled, files are in resources/app
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app', 'server.js')
    : path.join(__dirname, 'server.js');
  
  // Check if server is already running
  const http = require('http');
  const checkServer = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve(true); // Server is running
      });
      req.on('error', () => {
        resolve(false); // Server is not running
      });
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  };

  checkServer().then((isRunning) => {
    if (!isRunning) {
      console.log('Starting backend server...');
      // ✅ CRITICAL FIX: Use process.execPath with ELECTRON_RUN_AS_NODE
      // This works in both development and packaged app
      // No external "node" command needed
      serverProcess = spawn(process.execPath, [serverPath], {
        cwd: app.isPackaged ? path.join(process.resourcesPath, 'app') : __dirname,
        windowsHide: true, // Hide console in production
        stdio: 'ignore', // Ignore output in production
        env: { 
          ...process.env, 
          ELECTRON_RUN_AS_NODE: '1' // Makes Electron act as Node.js
        }
      });

      serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
      });

      serverProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          console.error('Server process exited with code:', code, 'signal:', signal);
        }
      });
    } else {
      console.log('Server already running, skipping start');
    }

    // Wait for server to be ready
    const waitForServer = () => {
      checkServer().then((ready) => {
        if (ready) {
          console.log('Server is ready, creating window...');
          createWindow();

          globalShortcut.register('Control+Shift+Down', () => {
            if (mainWindow && !mainWindow.isDestroyed())
              mainWindow.webContents.send('next-page');
          });

          globalShortcut.register('Control+Shift+Up', () => {
            if (mainWindow && !mainWindow.isDestroyed())
              mainWindow.webContents.send('previous-page');
          });
        } else {
          console.log('Waiting for server...');
          setTimeout(waitForServer, 500);
        }
      });
    };

    setTimeout(waitForServer, 1000);
  });
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch (err) {
      console.error('Error killing server on quit:', err);
    }
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});