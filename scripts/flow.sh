#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------------------------
# Run the entire job flow (for testing purposes)
# ------------------------------------------------------------------------------

echo "🏁 Clear job folders"
rm -rv ./data/jobs/*

echo "🏁 Setup project requirements"
./scripts/install.sh

echo "🏁 Scrape jobs"
./tools/scraper/run.sh

echo "🏁 Pre-process scraped jobs"
bun cli ingest

echo "🏁 Batch scoring jobs"
bun cli scoring

echo "🏁 Evaluate jobs"
bun cli evalution
