#!/bin/bash
set -euo pipefail

while true; do
  shopt -s nullglob
  files=(./data/jobs/shortlisted/*.json)
  if [[ ${#files[@]} -gt 0 ]]; then
    chosen="${files[RANDOM % ${#files[@]}]}"
    filename=$(basename "$chosen")
    mv "$chosen" ./data/jobs/agentworks/
    echo "🚀 Agent working"
    bun run cli/run.ts "$filename"
    end=$(date +%s)
    runtime=$((end-start))
    "🧹 Agent finished, runtime: $runtime seconds"
  fi
  sleep 1
done
