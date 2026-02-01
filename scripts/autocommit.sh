#!/usr/bin/env bash
set -euo pipefail

msg="${1:-}"
if [[ -z "${msg}" ]]; then
  msg="chore: auto-commit $(date '+%Y-%m-%d %H:%M:%S')"
fi

if [[ ! -d .git ]]; then
  echo "Not a git repository. Run: git init" >&2
  exit 1
fi

git add -A

if [[ -z "$(git status --porcelain)" ]]; then
  echo "Nothing to commit."
  exit 0
fi

git commit -m "${msg}"

