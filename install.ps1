# One-shot setup for Windows PowerShell.
#
# What it does:
#   1. Verifies Node >= 20 and Python >= 3.10.
#   2. `npm install` for the Next app.
#   3. `pip install -r requirements.txt` for the translation server.
#   4. Copies .env.local.example -> .env.local if missing.
#
# What it does NOT do:
#   - Install Node, Python, or pip system-wide. If a check fails, it
#     prints the recommended install command and exits.
#   - Pre-download the NLLB-200 model (~1.3 GB). That happens on the
#     first `npm run opus-mt` start.
#   - Touch any global config.
#
# Usage:
#   .\install.ps1
#   .\install.ps1 -SkipPython
#
# Re-run safely; idempotent.

[CmdletBinding()]
param(
  [switch]$SkipPython
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -LiteralPath $PSCommandPath -Parent)

function Write-Bold($msg)  { Write-Host $msg -ForegroundColor White }
function Write-Ok($msg)    { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Err($msg)   { Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Hint($msg)  { Write-Host "  → $msg" -ForegroundColor DarkGray }

Write-Bold "▶ Japanese Speech Companion — install.ps1"
Write-Bold ("  Working directory: " + (Get-Location).Path)
Write-Host ""

# -- Node ---------------------------------------------------------------------
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Err "Node.js is not installed."
  Write-Hint "Install via winget:    winget install OpenJS.NodeJS.LTS"
  Write-Hint "Or chocolatey:         choco install nodejs-lts"
  Write-Hint "Or download:           https://nodejs.org/"
  exit 1
}
$nodeVersion = & node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 20) {
  Write-Err "Node $nodeVersion is too old. This project needs Node 20+."
  Write-Hint "Update: winget upgrade OpenJS.NodeJS.LTS"
  exit 1
}
Write-Ok "Node v$nodeVersion"

# -- npm install --------------------------------------------------------------
if (-not (Test-Path 'node_modules')) {
  Write-Bold "▶ npm install"
  & npm install --no-audit --no-fund
} else {
  Write-Bold "▶ npm install (incremental)"
  & npm install --no-audit --no-fund --prefer-offline
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$pkgCount = (Get-ChildItem -Path node_modules -Directory -ErrorAction SilentlyContinue).Count
Write-Ok "Node deps installed ($pkgCount packages)"
Write-Host ""

# -- .env.local ---------------------------------------------------------------
if (-not (Test-Path '.env.local')) {
  if (Test-Path '.env.local.example') {
    Copy-Item '.env.local.example' '.env.local'
    Write-Ok "Created .env.local from the example"
    Write-Hint "Default LIBRETRANSLATE_URL is http://localhost:5001 (the bundled NLLB server)"
  } else {
    Write-Err "No .env.local.example found — skipping env setup"
  }
} else {
  Write-Ok ".env.local already present"
}
Write-Host ""

# -- Python (optional) --------------------------------------------------------
if ($SkipPython) {
  Write-Bold "▶ Skipping Python setup (-SkipPython)"
  Write-Hint "Sentence translation won't work until you set up scripts\mt_server.py separately."
  Write-Host ""
} else {
  $py = $null
  foreach ($candidate in @('py', 'python3', 'python')) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if (-not $cmd) { continue }
    try {
      $verStr = & $candidate -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
      if ($LASTEXITCODE -ne 0 -or -not $verStr) { continue }
      $parts = $verStr.Trim().Split('.')
      $major = [int]$parts[0]; $minor = [int]$parts[1]
      if ($major -ge 3 -and $minor -ge 10) {
        $py = $candidate
        $pyVer = $verStr.Trim()
        break
      }
    } catch { continue }
  }

  if (-not $py) {
    Write-Err "Python 3.10+ not found."
    Write-Hint "Install via winget:  winget install Python.Python.3.12"
    Write-Hint "Or download:         https://www.python.org/downloads/"
    Write-Hint "Re-run with -SkipPython to install Node deps only."
    exit 1
  }
  Write-Ok "$py (Python $pyVer)"

  Write-Bold "▶ pip install -r requirements.txt"
  & $py -m pip install --user --upgrade pip 2>&1 | Out-Null
  & $py -m pip install --user -r requirements.txt
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Ok "Python deps installed"
  Write-Host ""
}

# -- Done ---------------------------------------------------------------------
Write-Bold "▶ All set."
Write-Host @"

Next steps:
  - Start the translation server (~1.3 GB model on first run):
      npm run opus-mt
  - In another terminal, start the Next.js dev server:
      npm run dev
  - Open http://localhost:3000

The translation server takes ~3 min to download + convert the model
the first time, then ~5 sec to start on subsequent runs.
"@
