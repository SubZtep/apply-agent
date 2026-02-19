#!/bin/bash
set -euo pipefail

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

  echo "$output"
  exit 1
}

# Run validations

run_validation "Job dirs" "$SCRIPTS_DIR/create_job_dirs.sh"
run_validation "Setup" "$SCRIPTS_DIR/validate_config.sh"
run_validation "Tools" "$SCRIPTS_DIR/install_tools.sh"
run_validation "LLM" "$SCRIPTS_DIR/validate_llm.sh"

echo
echo "🎉 All validations passed!"
