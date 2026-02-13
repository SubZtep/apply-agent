#!/bin/bash
set -euo pipefail

while true; do
  echo "looking for scraped job data"
  if [[ ! -f ./data/jobs/inbox/processing ]]; then
    if [[ -f ./data/jobs/inbox/jobs.csv ]]; then
      touch ./data/jobs/inbox/processing
      start=$(date +%s)
      echo "🚀 Start bach scoring"
      echo "bach score scraped csv data"
      bun run ./batch/run.ts
      rm ./data/jobs/inbox/processing
      end=$(date +%s)
      runtime=$((end-start))
      "🧹 Finished bach scoring, runtime: $runtime seconds"
    fi
  fi
  sleep 1
done
