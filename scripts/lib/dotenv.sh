#!/usr/bin/env bash

# ------------------------------------------------------------------------------
# Safe dotenv loader (Node.js compatible parsing)
# System env vars take precedence over .env files
# Bash 3.2+ compatible (no associative arrays)
# ------------------------------------------------------------------------------

# Capture original environment as colon-delimited string
# Format: :VAR1:VAR2:VAR3: for safe substring matching
_ORIGINAL_ENV=":"
while IFS= read -r var; do
  _ORIGINAL_ENV="${_ORIGINAL_ENV}${var}:"
done < <(compgen -e)

dotenv_load() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Trim leading/trailing whitespace
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"

    # Skip empty lines or full-line comments
    [[ -z "$line" || "$line" == \#* ]] && continue

    # Support optional "export "
    if [[ "$line" =~ ^export[[:space:]]+ ]]; then
      line="${line#export }"
    fi

    # Parse KEY=VALUE
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local value="${BASH_REMATCH[2]}"

      # CRITICAL: Skip if this variable was originally set in the system environment
      # Check if :KEY: exists in our colon-delimited list (prevents partial matches)
      [[ "$_ORIGINAL_ENV" == *":${key}:"* ]] && continue

      # Remove inline comment for unquoted values
      if [[ ! "$value" =~ ^".*"$ && ! "$value" =~ ^\'.*\'$ ]]; then
        value="${value%%#*}"
        value="${value%"${value##*[![:space:]]}"}"
      fi

      # Remove surrounding quotes
      if [[ "$value" =~ ^"(.*)"$ ]]; then
        value="${BASH_REMATCH[1]}"
        value="${value//\\n/$'\n'}"
        value="${value//\\r/$'\r'}"
        value="${value//\\t/$'\t'}"
        value="${value//\\"/"}"
        value="${value//\\\\/\\}"
      elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
      fi

      export "$key=$value"
    else
      echo "dotenv: Skipping invalid line in $file: $line" >&2
    fi
  done < "$file"
}

dotenv_load ".env"
dotenv_load ".env.local"

# Optional: Clean up
unset _ORIGINAL_ENV
