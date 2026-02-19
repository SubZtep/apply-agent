#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------------------------
# Validate configured LMM models
# ------------------------------------------------------------------------------

source "scripts/lib/dotenv.sh"

API_MODELS_URL="${OPENAI_API_BASE_URL%/}/models"

resp=$(curl -sSfm 3 "$API_MODELS_URL") || {
  echo "Error: Unable to reach LMM API at $API_MODELS_URL" >&2
  exit 69
}

model_ids=$(echo "$resp" | jq -r '.data[]?.id')

if ! grep -Fxq "$AGENT_MODEL" <<< "$model_ids"; then
  echo "Error: AGENT_MODEL '$AGENT_MODEL' not found..." >&2
  exit 1
fi

if ! grep -Fxq "$BATCH_MODEL" <<< "$model_ids"; then
  echo "Error: BATCH_MODEL '$BATCH_MODEL' not found..." >&2
  exit 1
fi
