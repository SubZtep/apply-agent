#!/bin/bash
set -euo pipefail

while true; do
  if [[ ! -f ./data/jobs/inbox/jobs.csv ]]; then
    start=$(date +%s)
    echo "🚀 Start scraping"
    ./tools/scrape.sh
    end=$(date +%s)
    runtime=$((end-start))
    "🧹 Finished scraping, runtime: $runtime seconds"
  fi
  sleep 1
done
