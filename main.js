const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Completely remove the application menu
  Menu.setApplicationMenu(null);
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    show: false // Start hidden to prevent flash
  });

  // Extra protection against menu appearing
  mainWindow.setMenuBarVisibility(false);

  // Load the homepage
  mainWindow.loadFile('index_dutch.html');

  // Show window when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Handle sketch loading from renderer
ipcMain.on('load-sketch', (event, sketchPath) => {
  mainWindow.loadFile(sketchPath);
});

ipcMain.on('return-home', () => {
  mainWindow.loadFile('index.html');
});

ipcMain.on('return-home-dutch', () => {
  mainWindow.loadFile('index_dutch.html');
});