const assert = require('assert');
const { describe, it } = require('node:test');
const path = require('path');
const os = require('os');

// ─── Unit-testable helpers extracted from main.js logic ──────────────────────

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

function buildCliArgs(cli, message, sessionId) {
  switch (cli) {
    case 'claude':
      const args = ['-p', message, '--output-format', 'text'];
      if (sessionId) args.push('--continue');
      return { cmd: 'claude', args };
    case 'gemini':
      return { cmd: 'gemini', args: ['-p', message, '--output-format', 'text'] };
    case 'codex':
      return { cmd: 'codex', args: ['exec', '--skip-git-repo-check', message] };
    default:
      return null;
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getShell', () => {
  it('returns a string', () => {
    const shell = getShell();
    assert.strictEqual(typeof shell, 'string');
    assert.ok(shell.length > 0);
  });

  it('returns cmd.exe or COMSPEC on Windows', () => {
    if (process.platform === 'win32') {
      const shell = getShell();
      assert.ok(
        shell.toLowerCase().includes('cmd') || shell.toLowerCase().includes('powershell'),
        `Expected a Windows shell, got: ${shell}`
      );
    }
  });
});

describe('getEnhancedEnv', () => {
  it('returns an object with PATH', () => {
    const env = getEnhancedEnv();
    assert.ok(env.PATH, 'PATH should be defined');
    assert.strictEqual(typeof env.PATH, 'string');
  });

  it('prepends platform-specific paths', () => {
    const env = getEnhancedEnv();
    if (process.platform === 'win32') {
      assert.ok(env.PATH.includes('Roaming\\npm'), 'Should include npm global path');
      assert.ok(env.PATH.includes('Program Files\\nodejs'), 'Should include nodejs path');
    } else {
      assert.ok(env.PATH.includes('/opt/homebrew/bin'), 'Should include homebrew path');
      assert.ok(env.PATH.includes('/usr/local/bin'), 'Should include /usr/local/bin');
    }
  });

  it('preserves original PATH entries', () => {
    const env = getEnhancedEnv();
    const originalPath = process.env.PATH;
    assert.ok(env.PATH.includes(originalPath), 'Original PATH should be preserved');
  });
});

describe('buildCliArgs', () => {
  it('builds correct claude args', () => {
    const result = buildCliArgs('claude', 'hello world');
    assert.deepStrictEqual(result, {
      cmd: 'claude',
      args: ['-p', 'hello world', '--output-format', 'text']
    });
  });

  it('adds --continue for claude with sessionId', () => {
    const result = buildCliArgs('claude', 'follow up', 'session-123');
    assert.deepStrictEqual(result, {
      cmd: 'claude',
      args: ['-p', 'follow up', '--output-format', 'text', '--continue']
    });
  });

  it('builds correct gemini args with -p flag', () => {
    const result = buildCliArgs('gemini', 'test prompt');
    assert.deepStrictEqual(result, {
      cmd: 'gemini',
      args: ['-p', 'test prompt', '--output-format', 'text']
    });
  });

  it('builds correct codex args with exec subcommand', () => {
    const result = buildCliArgs('codex', 'write a function');
    assert.deepStrictEqual(result, {
      cmd: 'codex',
      args: ['exec', '--skip-git-repo-check', 'write a function']
    });
  });

  it('returns null for unknown CLI', () => {
    const result = buildCliArgs('unknown', 'test');
    assert.strictEqual(result, null);
  });

  it('handles messages with special characters', () => {
    const msg = 'explain "this" and \'that\' & more <stuff>';
    const result = buildCliArgs('claude', msg);
    assert.strictEqual(result.args[0], '-p');
    assert.strictEqual(result.args[1], msg);
  });
});

describe('CLI packages mapping', () => {
  const packages = {
    gemini: '@google/gemini-cli',
    codex: '@openai/codex',
    claude: '@anthropic-ai/claude-code'
  };

  it('maps gemini to @google/gemini-cli', () => {
    assert.strictEqual(packages.gemini, '@google/gemini-cli');
  });

  it('maps codex to @openai/codex', () => {
    assert.strictEqual(packages.codex, '@openai/codex');
  });

  it('maps claude to @anthropic-ai/claude-code', () => {
    assert.strictEqual(packages.claude, '@anthropic-ai/claude-code');
  });
});
