#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/lib/dotenv.sh"

# ------------------------------------------------------------------------------
# Environment validation and setup script
# Validates directories, configuration, dependencies, and LLM connectivity
# ------------------------------------------------------------------------------

# Exit codes from validate_config.sh:
#   3  - Missing config files (creates placeholders)
#   78 - Missing environment variables (fatal)

# Exit code from validate_llm.sh:
#   1  - Missing configured model(s) (fatal) # TODO: download
#   69 - Unavailable LLM service (fatal)

readonly SCRIPTS_DIR="scripts"

require_script() {
  if [ ! -f "$1" ]; then
    echo "❌ Missing required script: $1" >&2
    exit 1
  fi
}

run_validation() {
  local name="$1"
  local script="$2"
  local output
  local status

  require_script "$script"

  # Capture both stdout and stderr for error reporting
  output=$(bash "$script" 2>&1) || status=$?
  status=${status:-0}

  if [ "$status" -eq 0 ]; then
    echo "✅ $name OK"
    return 0
  fi

  echo "❌ $name NOT OK"

  # Handle specific exit codes for config validation
  if [ "$name" = "Setup" ]; then
    case $status in
      3)
        echo -e "Missing config file(s)\\n$output"
        echo "Creating placeholder files..."
        bash "$SCRIPTS_DIR/create_placeholders.sh"
        return 0  # Continue after creating placeholders
        ;;
      78)
        echo -e "Missing environment variables\\n$output"
        exit "$status"
        ;;
    esac
  fi

  if [ "$name" = "LLM" ]; then
    case $status in
      1)
        source "$SCRIPTS_DIR/lib/dotenv.sh"
        echo "Ollama base URL: ${OLLAMA_BASE_URL}"
        resp=$(curl -sSfm 3 "${OLLAMA_BASE_URL%/}/api/tags")
        models=$(echo "$resp" | jq -r '.models[]?.name')
        required_models=("$AGENT_MODEL" "$BATCH_MODEL")
        for model in "${required_models[@]}"; do
          if ! grep -Fxq "$model" <<< "$models"; then
            echo "Pulling missing model: $model"
            curl -sS "${OLLAMA_BASE_URL%/}/api/pull" -d "{"model":"$model"}"
          fi
        done
        return 0  # Continue after pulled required models
        ;;
      69)
        exit 1
        ;;
    esac
  fi

  echo "$output"
  exit 1
}

# Run validations

run_validation "Job dirs" "$SCRIPTS_DIR/create_job_dirs.sh"
run_validation "Setup" "$SCRIPTS_DIR/validate_config.sh"
# run_validation "Tools" "$SCRIPTS_DIR/install_tools.sh"
run_validation "LLM" "$SCRIPTS_DIR/validate_llm.sh"

echo
echo "🎉 All validations passed!"
