#!/bin/bash
set -euo pipefail

source "scripts/lib/dotenv.sh"
dotenv_load ".env"
dotenv_load ".env.local"

# Check config files and set defaults if needed

if [[ ! -f "${CV_FILE}" ]]; then
  echo "CV_FILE '${CV_FILE}' not found. Creating a placeholder CV file."
  echo -e "# My CV\n\nI like to work.\n\n## Experience\n\nHere and there, I did this and that.\n\n## Skills\n\nTBD.\n" > "${CV_FILE}"
fi

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "CONFIG_FILE '${CONFIG_FILE}' not found. Creating a placeholder config file."
  echo -e "jobspy:\n  site_name:\n    - linkedin\n  search_term: scripting ai\n" > "${CONFIG_FILE}"
fi
