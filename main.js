const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');

let mainWindow;
const activeProcesses = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    minWidth: 600,
    minHeight: 500,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ─── Helpers ────────────────────────────────────────────────────────────────

function getShell() {
  return process.platform === 'win32'
    ? process.env.COMSPEC || 'cmd.exe'
    : process.env.SHELL || '/bin/zsh';
}

function getEnhancedEnv() {
  const extra = process.platform === 'win32'
    ? [
        path.join(os.homedir(), 'AppData', 'Roaming', 'npm'),
        'C:\\Program Files\\nodejs'
      ]
    : [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        path.join(os.homedir(), '.npm-global/bin')
      ];
  return {
    ...process.env,
    PATH: [...extra, process.env.PATH].join(path.delimiter)
  };
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, {
      shell: getShell(),
      env: getEnhancedEnv(),
      timeout: 120000
    }, (error, stdout, stderr) => {
      if (error) reject({ error, stderr: stderr || '', stdout: stdout || '' });
      else resolve({ stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

async function commandExists(cmd) {
  try {
    const check = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    await runCommand(check);
    return true;
  } catch { return false; }
}

async function getVersion(cmd) {
  try {
    const { stdout } = await runCommand(`${cmd} --version`);
    return stdout.trim().split('\n')[0];
  } catch { return null; }
}

// ─── IPC: Setup ─────────────────────────────────────────────────────────────

ipcMain.handle('get-platform', () => process.platform);

ipcMain.handle('check-prerequisites', async () => {
  const node = await commandExists('node');
  const npm = await commandExists('npm');
  const nodeVersion = node ? await getVersion('node') : null;
  const result = { node, npm, nodeVersion };
  if (process.platform === 'darwin') {
    result.homebrew = await commandExists('brew');
  }
  return result;
});

ipcMain.handle('check-cli', async (_event, cli) => {
  const installed = await commandExists(cli);
  const version = installed ? await getVersion(cli) : null;
  return { installed, version };
});

ipcMain.handle('install-cli', async (_event, cli) => {
  const packages = {
    gemini: '@google/gemini-cli',
    codex: '@openai/codex',
    claude: '@anthropic-ai/claude-code'
  };
  try {
    if (await commandExists(cli)) {
      const version = await getVersion(cli);
      return { success: true, message: version || 'Already installed', alreadyInstalled: true };
    }
    await runCommand(`npm install -g ${packages[cli]}`);
    const version = await getVersion(cli);
    return { success: true, message: version || 'Installed' };
  } catch (err) {
    return { success: false, message: err.stderr || String(err) };
  }
});

// ─── IPC: Chat ──────────────────────────────────────────────────────────────

ipcMain.handle('send-message', async (event, cli, message, sessionId) => {
  // Build the CLI command for non-interactive use
  const escaped = message.replace(/"/g, '\\"');
  let cmd, args;

  switch (cli) {
    case 'claude':
      args = ['-p', message, '--output-format', 'text'];
      if (sessionId) args.push('--continue');
      cmd = 'claude';
      break;
    case 'gemini':
      cmd = 'gemini';
      args = ['-p', message, '--output-format', 'text'];
      break;
    case 'codex':
      cmd = 'codex';
      args = ['exec', message];
      break;
    default:
      return { success: false, error: `Unknown CLI: ${cli}` };
  }

  // Generate a unique process ID
  const procId = `${cli}-${Date.now()}`;

  return new Promise((resolve) => {
    let output = '';
    let errorOutput = '';

    const proc = spawn(cmd, args, {
      shell: true,
      env: getEnhancedEnv(),
      cwd: os.homedir()
    });

    activeProcesses.set(procId, proc);

    // Stream stdout chunks to renderer
    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stream-chunk', cli, chunk);
      }
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      activeProcesses.delete(procId);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stream-end', cli);
      }
      if (code === 0 || output.length > 0) {
        resolve({ success: true, response: output.trim(), procId });
      } else {
        resolve({
          success: false,
          error: errorOutput.trim() || `Process exited with code ${code}`,
          procId
        });
      }
    });

    proc.on('error', (err) => {
      activeProcesses.delete(procId);
      resolve({ success: false, error: err.message, procId });
    });
  });
});

ipcMain.handle('stop-process', async (_event, cli) => {
  for (const [id, proc] of activeProcesses) {
    if (id.startsWith(cli)) {
      proc.kill();
      activeProcesses.delete(id);
    }
  }
});

ipcMain.handle('open-terminal-with-cli', async (_event, cli) => {
  const cmd = cli;
  if (process.platform === 'darwin') {
    spawn('osascript', ['-e', `tell app "Terminal" to do script "cd ~ && ${cmd}"`]);
  } else if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', cmd], { shell: true });
  }
  return { success: true };
});

ipcMain.handle('open-url', async (_event, url) => {
  shell.openExternal(url);
});

// Cleanup
app.on('before-quit', () => {
  for (const [, proc] of activeProcesses) {
    proc.kill();
  }
  activeProcesses.clear();
});
