const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");

const serverDir = path.join(__dirname, "..", "server");
const clientIndex = path.join(__dirname, "..", "client", "dist", "index.html");

let serverProcess;
let mainWindow;

function startServer() {
  const envPath = path.join(serverDir, ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Missing ${envPath}. Copy server/.env.example to server/.env and set JWT_SECRET first.`
    );
  }

  serverProcess = fork(path.join(serverDir, "src", "index.js"), [], {
    cwd: serverDir,
    env: process.env,
  });

  serverProcess.on("exit", (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

function createWindow() {
  if (!fs.existsSync(clientIndex)) {
    throw new Error(
      `Missing ${clientIndex}. Run "npm run build" in client/ before starting the desktop app.`
    );
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    title: "Care Schedule",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open any external links (e.g. target="_blank") in the OS browser, not inside the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadFile(clientIndex);
}

app.whenReady().then(() => {
  try {
    startServer();
    createWindow();
  } catch (err) {
    console.error(err.message);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopServer);
