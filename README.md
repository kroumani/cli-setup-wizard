# CLI Setup Wizard for Mac

One-command setup for **Gemini**, **Codex**, and **Claude** CLI tools.

## Quick Start

Open Terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/mac-setup/setup-cli-tools.sh | bash
```

Or download and run locally:

```bash
chmod +x setup-cli-tools.sh
./setup-cli-tools.sh
```

## What Happens

The script runs **everything automatically**. You just need to:

1. **Press ENTER** to start
2. **Sign in via browser** when each tool opens authentication
3. **Press ENTER** after each authentication completes

That's it!

## What Gets Installed

| Tool | Package | Auth Method |
|------|---------|-------------|
| **Gemini CLI** | `@google/gemini-cli` | Google account (browser) |
| **Codex CLI** | `@openai/codex` | ChatGPT/OpenAI account (browser) |
| **Claude CLI** | `@anthropic-ai/claude-code` | Anthropic account (browser) |

Prerequisites installed if missing:
- Homebrew
- Node.js 18+

## After Setup

Just run any tool from your project directory:

```bash
cd your-project
gemini    # Start Gemini
codex     # Start Codex
claude    # Start Claude
```

## Troubleshooting

### "command not found"

Open a new terminal window, or run:
```bash
source ~/.zshrc
```

### Re-authenticate a tool

```bash
gemini    # Re-runs auth if needed
codex     # Re-runs auth if needed
claude    # Re-runs auth if needed
```

### Manual installation

If the script fails for a specific tool:

```bash
npm install -g @google/gemini-cli     # Gemini
npm install -g @openai/codex          # Codex
npm install -g @anthropic-ai/claude-code  # Claude
```

## References

- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Codex CLI](https://github.com/openai/codex)
- [Claude Code](https://claude.ai/code)
