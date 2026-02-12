#!/bin/bash

# CLI Setup Script for Mac
# Installs and authenticates Gemini, Codex, and Claude CLIs
# User just needs to complete browser authentication when prompted

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print styled messages
print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_action() {
    echo -e "${MAGENTA}➤${NC} ${BOLD}$1${NC}"
}

wait_for_user() {
    echo ""
    echo -e "${YELLOW}${BOLD}>>> $1${NC}"
    echo -e "${YELLOW}    Press ENTER when ready to continue...${NC}"
    read -r
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# WELCOME
# ============================================================================

clear
print_header "🚀 CLI Tools Setup Wizard"

echo "This script will install and configure:"
echo ""
echo "  ${BOLD}1. Gemini CLI${NC}  - Google's AI coding assistant"
echo "  ${BOLD}2. Codex CLI${NC}   - OpenAI's coding agent"
echo "  ${BOLD}3. Claude CLI${NC}  - Anthropic's Claude Code"
echo ""
echo "Each tool will open your browser for authentication."
echo "Just sign in when prompted - the script handles the rest!"
echo ""

wait_for_user "Ready to begin?"

# ============================================================================
# PREREQUISITES CHECK
# ============================================================================

print_header "Step 1: Checking Prerequisites"

# Check for Homebrew
if command_exists brew; then
    print_success "Homebrew is installed"
else
    print_step "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    print_success "Homebrew installed"
fi

# Check for Node.js (need v18+)
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_VERSION" -ge 18 ]]; then
        print_success "Node.js v$(node --version | sed 's/v//') installed (v18+ required)"
    else
        print_warning "Node.js $(node --version) is too old, upgrading..."
        brew upgrade node
        print_success "Node.js upgraded"
    fi
else
    print_step "Installing Node.js via Homebrew..."
    brew install node
    print_success "Node.js installed"
fi

# ============================================================================
# GEMINI CLI
# ============================================================================

print_header "Step 2: Gemini CLI (Google)"

if command_exists gemini; then
    print_success "Gemini CLI is already installed"
    gemini --version 2>/dev/null || true
else
    print_step "Installing Gemini CLI..."
    npm install -g @google/gemini-cli
    print_success "Gemini CLI installed"
fi

echo ""
print_action "Starting Gemini authentication..."
print_info "Your browser will open for Google sign-in."
sleep 2

# Run gemini to trigger first-time setup and auth
gemini --help >/dev/null 2>&1 || true

echo ""
print_info "Running 'gemini' to complete setup..."
echo ""

# This will trigger the interactive setup/auth
gemini || true

wait_for_user "Gemini setup complete"

# ============================================================================
# CODEX CLI (OpenAI)
# ============================================================================

print_header "Step 3: Codex CLI (OpenAI)"

if command_exists codex; then
    print_success "Codex CLI is already installed"
    codex --version 2>/dev/null || true
else
    print_step "Installing Codex CLI..."
    npm install -g @openai/codex
    print_success "Codex CLI installed"
fi

echo ""
print_action "Starting Codex authentication..."
print_info "Your browser will open for OpenAI/ChatGPT sign-in."
sleep 2

# Run codex to trigger auth
echo ""
codex || true

wait_for_user "Codex setup complete"

# ============================================================================
# CLAUDE CLI (Anthropic)
# ============================================================================

print_header "Step 4: Claude CLI (Anthropic)"

if command_exists claude; then
    print_success "Claude CLI is already installed"
    claude --version 2>/dev/null || true
else
    print_step "Installing Claude CLI..."
    npm install -g @anthropic-ai/claude-code
    print_success "Claude CLI installed"
fi

echo ""
print_action "Starting Claude authentication..."
print_info "Your browser will open for Anthropic sign-in."
sleep 2

# Run claude to trigger auth
echo ""
claude || true

wait_for_user "Claude setup complete"

# ============================================================================
# VERIFICATION
# ============================================================================

print_header "Step 5: Verification"

echo "Checking installed CLIs..."
echo ""

GEMINI_OK=false
CODEX_OK=false
CLAUDE_OK=false

# Gemini
if command_exists gemini; then
    GEMINI_VERSION=$(gemini --version 2>/dev/null || echo "installed")
    print_success "Gemini CLI: $GEMINI_VERSION"
    GEMINI_OK=true
else
    print_error "Gemini CLI: not found"
fi

# Codex
if command_exists codex; then
    CODEX_VERSION=$(codex --version 2>/dev/null || echo "installed")
    print_success "Codex CLI: $CODEX_VERSION"
    CODEX_OK=true
else
    print_error "Codex CLI: not found"
fi

# Claude
if command_exists claude; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "installed")
    print_success "Claude CLI: $CLAUDE_VERSION"
    CLAUDE_OK=true
else
    print_error "Claude CLI: not found"
fi

# ============================================================================
# COMPLETION
# ============================================================================

print_header "🎉 Setup Complete!"

echo "Your CLI tools are ready to use!"
echo ""
echo -e "${BOLD}Quick Start Commands:${NC}"
echo ""
if $GEMINI_OK; then
    echo "  ${CYAN}gemini${NC}   - Start Gemini in your project directory"
fi
if $CODEX_OK; then
    echo "  ${CYAN}codex${NC}    - Start Codex in your project directory"
fi
if $CLAUDE_OK; then
    echo "  ${CYAN}claude${NC}   - Start Claude Code in your project directory"
fi
echo ""
echo -e "${BOLD}Tips:${NC}"
echo "  • Run any tool from your project's root directory"
echo "  • Each tool maintains its own authentication"
echo "  • Use --help with any command for options"
echo ""

if ! $GEMINI_OK || ! $CODEX_OK || ! $CLAUDE_OK; then
    echo -e "${YELLOW}Some tools may need manual setup. Run individually:${NC}"
    if ! $GEMINI_OK; then echo "  npm install -g @google/gemini-cli && gemini"; fi
    if ! $CODEX_OK; then echo "  npm install -g @openai/codex && codex"; fi
    if ! $CLAUDE_OK; then echo "  npm install -g @anthropic-ai/claude-code && claude"; fi
    echo ""
fi

print_success "All done! Happy coding! 🚀"
echo ""
