#!/usr/bin/env bash
#
# handoff-bundle.sh — package the repo for a chat-only agent that can't read
# GitHub OR open a zip. Everything goes into ONE plain-text file it can ingest.
#
# Produces, in ./handoff/ :
#   1. mentorforge-flat.txt  — every tracked text file concatenated with path
#                              headers + the rebuild manifest at the very top
#
# If it's too big for one paste, see the split note printed at the end.
#
# Secrets are safe: this only reads TRACKED files, and .env* is gitignored.
# Run from the repo root.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
OUT=handoff
rm -rf "$OUT"
mkdir -p "$OUT"

# --- Flattened text bundle --------------------------------------------------
FLAT="$OUT/mentorforge-flat.txt"

# Manifest goes at the TOP so the agent reads intent before implementation.
cat > "$FLAT" <<'EOF'
################################################################################
# MentorForge — Complete Source Handoff (single-file)
#
# This ONE file contains the full source of MentorForge, a Next.js app.
# GitHub is not needed. Each source file below is delimited by a line:
#     ===== FILE: <path> =====
# Docs come first (intent), then code (implementation).
#
# TO REBUILD:
#   - Node version is in .nvmrc;  `npm install` from package.json
#   - Copy .env.example -> .env and provision YOUR OWN secrets (Supabase,
#     Google OAuth, Resend/SMTP, Plausible). The real .env is NOT included.
#   - DB schema is in prisma/ — run the Prisma migrations against your DB.
#   - `npm run dev` to start.
#
# READ ORDER: README.md -> ARCHITECTURE.md -> DESIGN.md (obey for all UI)
#             -> CLAUDE.md -> docs/ specs -> TODOS.md -> then the code.
################################################################################
EOF

# Skip huge / low-signal / binary files (package-lock is noise for a rebuild).
SKIP_REGEX='package-lock\.json|\.(png|jpg|jpeg|gif|ico|webp|woff2?|ttf|pdf|zip)$'

# Docs first so the agent reads intent before implementation.
# NUL-delimited to survive spaces in filenames.
{ git ls-files -z '*.md'; git ls-files -z | grep -zvE '\.md$'; } | \
while IFS= read -r -d '' f; do
  printf '%s' "$f" | grep -qE "$SKIP_REGEX" && continue
  git check-attr binary -- "$f" | grep -q 'binary: set' && continue
  {
    printf '\n\n===== FILE: %s =====\n' "$f"
    cat "$f"
  } >> "$FLAT"
done
LINES=$(wc -l < "$FLAT" | tr -d ' ')
BYTES=$(wc -c < "$FLAT" | tr -d ' ')
WORDS=$(wc -w < "$FLAT" | tr -d ' ')
# ~1.3 tokens/word is a rough LLM estimate.
APPROX_TOK=$(( WORDS * 13 / 10 ))
echo "✓ flat text: $LINES lines, $(du -h "$FLAT" | cut -f1), ~${APPROX_TOK} tokens (est.)"

echo
echo "Deliver this file:"
ls -lh "$FLAT"
echo
if [ "$BYTES" -gt 1500000 ]; then
  echo "NOTE: it's large. If the agent's paste/upload limit chokes, split it:"
  echo "  split -d -b 900k \"$FLAT\" \"$OUT/mentorforge-flat.part-\""
  echo "  # then paste part-00, part-01, ... in order (headers stay intact)."
fi
