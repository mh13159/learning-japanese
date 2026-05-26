#!/usr/bin/env bash
# One-shot setup for WSL / Linux / macOS.
#
# What it does:
#   1. Verifies Node ≥ 20 and Python ≥ 3.10.
#   2. `npm install` for the Next app.
#   3. `pip install -r requirements.txt` for the translation server.
#   4. Copies .env.local.example -> .env.local if missing.
#
# What it does NOT do:
#   - Install Node, Python, or pip system-wide. If a check fails, it
#     prints the recommended install command and exits.
#   - Pre-download the NLLB-200 model (~1.3 GB). That happens on the
#     first `npm run opus-mt` start, with progress shown in the log.
#   - Touch any global config.
#
# Usage:
#   ./install.sh
#   ./install.sh --skip-python   # if you don't plan to run mt_server.py
#
# Re-run safely; idempotent.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

SKIP_PYTHON=0
for arg in "$@"; do
  case "$arg" in
    --skip-python) SKIP_PYTHON=1 ;;
    -h|--help)
      sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

bold()   { printf '\033[1m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
red()    { printf '\033[31m%s\033[0m\n' "$*" >&2; }
hint()   { printf '  → %s\n' "$*"; }

bold "▶ Japanese Speech Companion — install.sh"
bold "  Working directory: $REPO_DIR"
echo

# -- Node ---------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  red "Node.js is not installed."
  hint "Install via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install --lts"
  hint "Or apt: sudo apt install nodejs npm  (often too old — prefer nvm)"
  exit 1
fi

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "Node $NODE_MAJOR is too old. This project needs Node 20+."
  hint "If you use nvm: nvm install 20 && nvm use 20"
  exit 1
fi
green "✓ Node $(node --version)"

# -- npm install --------------------------------------------------------------
if [ ! -d node_modules ]; then
  bold "▶ npm install"
  npm install --no-audit --no-fund
else
  bold "▶ npm install (incremental)"
  npm install --no-audit --no-fund --prefer-offline
fi
green "✓ Node deps installed ($(ls node_modules | wc -l) packages)"
echo

# -- .env.local ---------------------------------------------------------------
if [ ! -f .env.local ]; then
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    green "✓ Created .env.local from the example"
    hint "Default LIBRETRANSLATE_URL is http://localhost:5001 (the bundled NLLB server)"
  else
    red "No .env.local.example found — skipping env setup"
  fi
else
  green "✓ .env.local already present"
fi
echo

# -- Python (optional) --------------------------------------------------------
if [ "$SKIP_PYTHON" -eq 1 ]; then
  bold "▶ Skipping Python setup (--skip-python)"
  hint "Sentence translation won't work until you set up scripts/mt_server.py separately."
  echo
else
  PY=""
  for candidate in python3.13 python3.12 python3.11 python3.10 python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
      VER=$("$candidate" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
      MAJOR=${VER%.*}; MINOR=${VER#*.}
      if [ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 10 ]; then
        PY="$candidate"
        break
      fi
    fi
  done

  if [ -z "$PY" ]; then
    red "Python 3.10+ not found."
    hint "Install via your package manager, e.g. sudo apt install python3.12 python3.12-venv python3-pip"
    hint "Or pyenv: curl https://pyenv.run | bash && pyenv install 3.12 && pyenv local 3.12"
    hint "Re-run with --skip-python to install Node deps only."
    exit 1
  fi
  green "✓ $PY ($($PY --version))"

  bold "▶ pip install -r requirements.txt"
  "$PY" -m pip install --user --upgrade pip >/dev/null 2>&1 || true
  "$PY" -m pip install --user -r requirements.txt
  green "✓ Python deps installed"
  echo
fi

# -- Done ---------------------------------------------------------------------
bold "▶ All set."
cat <<EOF

Next steps:
  • Start the translation server (~1.3 GB model on first run):
      npm run opus-mt
  • In another terminal, start the Next.js dev server:
      npm run dev
  • Open http://localhost:3000

The translation server takes ~3 min to download + convert the model
the first time, then ~5 sec to start on subsequent runs.
EOF
