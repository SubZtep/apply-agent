#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/lib/dotenv.sh"

# ------------------------------------------------------------------------------
# Validate configuration
# ------------------------------------------------------------------------------

# Validate env vars

missing_vars=()
if [[ -z "${OLLAMA_BASE_URL:-}" ]]; then
  missing_vars+=("OLLAMA_BASE_URL")
elif [[ "${OLLAMA_BASE_URL}" == */ ]]; then
  missing_vars+=("OLLAMA_BASE_URL (must not be empty or end with /)")
fi
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
