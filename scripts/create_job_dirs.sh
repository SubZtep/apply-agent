#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/lib/dotenv.sh"

# ------------------------------------------------------------------------------
# Create required directiories
# ------------------------------------------------------------------------------

JOB_DIRS=(inbox screened_out shortlisted awaiting_input declined approved)

for dir in "${JOB_DIRS[@]}"; do
  mkdir -p "${JOBS_DIR}/${dir}" || {
    echo "❌ Error: Failed to create directory ${JOBS_DIR}/${dir}" >&2
    exit 1
  }
done

echo "✅ Created missing folders."
