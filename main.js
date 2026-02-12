const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// Helper to run shell commands
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const shell = process.env.SHELL || '/bin/zsh';
    const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;

    exec(fullCommand, {
      shell,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`
      }
    }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Check if command exists
async function commandExists(cmd) {
  try {
    await runCommand(`which ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

// Get command version
async function getVersion(cmd) {
  try {
    const { stdout } = await runCommand(`${cmd} --version`);
    return stdout.trim().split('\n')[0];
  } catch {
    return null;
  }
}

// IPC Handlers

ipcMain.handle('check-prerequisites', async () => {
  const results = {
    homebrew: await commandExists('brew'),
    node: await commandExists('node'),
    nodeVersion: null,
    npm: await commandExists('npm')
  };

  if (results.node) {
    results.nodeVersion = await getVersion('node');
  }

  return results;
});

ipcMain.handle('install-homebrew', async (event) => {
  try {
    // Homebrew install is interactive, we'll just check and guide
    const exists = await commandExists('brew');
    if (exists) {
      return { success: true, message: 'Homebrew already installed' };
    }

    // Open terminal with install command
    const installCmd = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
    await runCommand(`osascript -e 'tell app "Terminal" to do script "${installCmd}"'`);

    return { success: true, message: 'Homebrew installer opened in Terminal. Please complete installation there.', manual: true };
  } catch (err) {
    return { success: false, message: err.stderr || err.message };
  }
});

ipcMain.handle('install-node', async () => {
  try {
    const hasNode = await commandExists('node');
    if (hasNode) {
      const version = await getVersion('node');
      return { success: true, message: `Node.js already installed: ${version}` };
    }

    await runCommand('brew install node');
    const version = await getVersion('node');
    return { success: true, message: `Node.js installed: ${version}` };
  } catch (err) {
    return { success: false, message: err.stderr || err.message };
  }
});

ipcMain.handle('check-cli', async (event, cli) => {
  const commands = {
    gemini: 'gemini',
    codex: 'codex',
    claude: 'claude'
  };

  const cmd = commands[cli];
  const exists = await commandExists(cmd);
  let version = null;

  if (exists) {
    version = await getVersion(cmd);
  }

  return { installed: exists, version };
});

ipcMain.handle('install-cli', async (event, cli) => {
  const packages = {
    gemini: '@google/gemini-cli',
    codex: '@openai/codex',
    claude: '@anthropic-ai/claude-code'
  };

  const pkg = packages[cli];

  try {
    // Check if already installed
    const commands = { gemini: 'gemini', codex: 'codex', claude: 'claude' };
    const exists = await commandExists(commands[cli]);

    if (exists) {
      const version = await getVersion(commands[cli]);
      return { success: true, message: `Already installed: ${version}`, alreadyInstalled: true };
    }

    // Install via npm
    await runCommand(`npm install -g ${pkg}`);

    const version = await getVersion(commands[cli]);
    return { success: true, message: `Installed: ${version || 'successfully'}` };
  } catch (err) {
    return { success: false, message: err.stderr || err.message };
  }
});

ipcMain.handle('authenticate-cli', async (event, cli) => {
  try {
    const commands = {
      gemini: 'gemini',
      codex: 'codex',
      claude: 'claude'
    };

    const cmd = commands[cli];

    // Open Terminal and run the CLI which will trigger auth
    const script = `
      tell application "Terminal"
        activate
        do script "cd ~ && ${cmd}"
      end tell
    `;

    await runCommand(`osascript -e '${script}'`);

    return { success: true, message: 'Authentication started in Terminal' };
  } catch (err) {
    return { success: false, message: err.stderr || err.message };
  }
});

ipcMain.handle('open-url', async (event, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});
