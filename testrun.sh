#!/bin/bash
set -euo pipefail
start=$(date +%s)

cleanup() {
  read -p "🧹 Clear existing data and start fresh? (y/n) " yn
  case $yn in
    [yY] ) echo "🧼 Cleaning up...";
      ;;
    [nN] ) echo "➜  bye";
      exit;;
    * ) echo "❌ escaping...";
      exit;;
  esac
  rm ./data/jobs/inbox/jobs.csv || true
  rm ./data/jobs/screened_out/*.json || true
  rm ./data/jobs/shortlisted/*.json || true
}

cleanup
echo "🚀 Full Flow Run"
trap cleanup EXIT

echo "⏳ Scraping listings..."
./tools/scrape.sh

echo "⏳ Batch scoring..."
bun run score_batch

# TBC.

end=$(date +%s)
runtime=$((end-start))
echo "🕒 Runtime: $runtime seconds"
