#!/bin/bash
set -euo pipefail
start=$(date +%s)

cleanup() {
  # echo "🧪 Existing job and scrape data:"
  # echo
  # ls ./data/jobs/**
  # echo
  # read -p "🧹 Clear existing data for a fresh start? (y/n) " yn
  # case $yn in
  #   [yY] ) echo "🧼 Cleaning up...";
  #     ;;
  #   [nN] ) echo "➜  bye";
  #     exit;;
  #   * ) echo "❌ escaping...";
  #     exit;;
  # esac
  echo "🧼 Cleaning up..."
  rm ./data/jobs/inbox/*.csv || true
  rm ./data/jobs/approved/*.json || true
  rm ./data/jobs/awaiting_input/*.json || true
  rm ./data/jobs/declined/*.json || true
  rm ./data/jobs/screened_out/*.json || true
  rm ./data/jobs/shortlisted/*.json || true
}

cleanup
# echo "🚀 Full Flow Run"
# # trap cleanup EXIT

# echo "⏳ Scraping listings..."
# ./tools/scrape.sh

# echo "⏳ Batch scoring..."
# bun run score_batch

# echo "⏳ Challenging shortlisted jobs..."
# bun run start

# # TBC.

# end=$(date +%s)
# runtime=$((end-start))
# echo "🕒 Runtime: $runtime seconds"
