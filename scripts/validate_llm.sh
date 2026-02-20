#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/lib/dotenv.sh"

# ------------------------------------------------------------------------------
# Validate configured LMM models
# ------------------------------------------------------------------------------

API_MODELS_URL="${OLLAMA_BASE_URL%/}/api/tags"

resp=$(curl -sSfm 3 "$API_MODELS_URL") || {
  echo "Error: Unable to reach LMM API at $API_MODELS_URL" >&2
  exit 69
}

models=$(echo "$resp" | jq -r '.models[]?.name')

if ! grep -Fxq "$AGENT_MODEL" <<< "$models"; then
  echo "Error: AGENT_MODEL '$AGENT_MODEL' not found..." >&2
  exit 1
fi

if ! grep -Fxq "$BATCH_MODEL" <<< "$models"; then
  echo "Error: BATCH_MODEL '$BATCH_MODEL' not found..." >&2
  exit 1
fi
