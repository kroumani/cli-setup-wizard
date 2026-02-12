# CLI Setup Wizard

A beautiful Mac app that installs and configures **Gemini**, **Codex**, and **Claude** CLI tools with visual feedback.

![CLI Setup Wizard](https://img.shields.io/badge/Platform-macOS-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Download

Get the latest release from the [Releases page](https://github.com/kroumani/cli-setup-wizard/releases).

Or use the shell script:
```bash
curl -fsSL https://raw.githubusercontent.com/kroumani/cli-setup-wizard/master/setup-cli-tools.sh | bash
```

## Features

- **Visual Progress** - See exactly what's happening at each step
- **One-Click Install** - Install all three CLI tools with a single button
- **Automatic Prereqs** - Installs Homebrew and Node.js if needed
- **Easy Auth** - Opens each CLI for browser authentication

## What Gets Installed

| Tool | Package | Description |
|------|---------|-------------|
| **Gemini** | `@google/gemini-cli` | Google's AI coding assistant |
| **Codex** | `@openai/codex` | OpenAI's coding agent |
| **Claude** | `@anthropic-ai/claude-code` | Anthropic's Claude Code |

## How It Works

1. **Launch the app** - Opens the setup wizard
2. **Prerequisites check** - Verifies/installs Homebrew & Node.js
3. **Install CLIs** - Click "Install All" to install all three tools
4. **Authenticate** - Click each "Open" button to authenticate via browser

## Development

```bash
# Install dependencies
npm install

# Run in development
npm start

# Build Mac app
npm run build
```

## Building

The GitHub Actions workflow automatically builds:
- `.dmg` installer
- `.zip` archive

To trigger a release, push a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Screenshots

The app features:
- Dark gradient UI with neon accents
- Real-time progress indicators
- Status cards for each CLI tool
- Success/error visual feedback

## License

MIT
