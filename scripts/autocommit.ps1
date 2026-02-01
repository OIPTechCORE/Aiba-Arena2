param(
  [Parameter(Mandatory = $false)]
  [string]$Message
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
  Write-Error "Not a git repository. Run: git init"
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "chore: auto-commit $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

git add -A

# If nothing to commit, exit cleanly
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Output "Nothing to commit."
  exit 0
}

git commit -m $Message

