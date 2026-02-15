#!/bin/bash
set -euo pipefail

source "scripts/lib/dotenv.sh"
dotenv_load ".env"
dotenv_load ".env.local"

# Validate config

missing_vars=()
[[ -z "${OPENAI_API_BASE_URL:-}" ]] && missing_vars+=("OPENAI_API_BASE_URL")
[[ -z "${AGENT_MODEL:-}" ]] && missing_vars+=("AGENT_MODEL")
[[ -z "${BATCH_MODEL:-}" ]] && missing_vars+=("BATCH_MODEL")
[[ -z "${JOBS_DIR:-}" ]] && missing_vars+=("JOBS_DIR")
[[ -z "${CV_FILE:-}" ]] && missing_vars+=("CV_FILE")
[[ -z "${CONFIG_FILE:-}" ]] && missing_vars+=("CONFIG_FILE")

if (( ${#missing_vars[@]} > 0 )); then
  echo "Error: The following required environment variables are not set: ${missing_vars[*]}" >&2
  exit 78
fi

# Validate CV file

if [[ ! -f "${CV_FILE}" ]]; then
  echo "Error: CV_FILE '${CV_FILE}' does not exist." >&2
  exit 3
fi

# Validate config file

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Error: CONFIG_FILE '${CONFIG_FILE}' does not exist." >&2
  exit 3
fi

# Validate LMM API

API_MODELS_URL="${OPENAI_API_BASE_URL%/}/models"

resp=$(curl -sS --fail "$API_MODELS_URL") || {
  echo "Error: Unable to reach LMM API at $API_MODELS_URL" >&2
  exit 69
}

# Validate configured models

model_ids=$(echo "$resp" | jq -r '.data[]?.id')

if ! grep -Fxq "$AGENT_MODEL" <<< "$model_ids"; then
  echo "Error: AGENT_MODEL '$AGENT_MODEL' not found..." >&2
  exit 69
fi

if ! grep -Fxq "$BATCH_MODEL" <<< "$model_ids"; then
  echo "Error: BATCH_MODEL '$BATCH_MODEL' not found..." >&2
  exit 69
fi

# Create job dirs

for dir in inbox screened_out shortlisted awaiting_input declined approved; do
  mkdir -p "${JOBS_DIR}/${dir}" || {
    echo "Error: Failed to create directory ${JOBS_DIR}/${dir}" >&2
    exit 1
  }
done
