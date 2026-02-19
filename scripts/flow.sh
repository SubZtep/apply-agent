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
bun ./src/ingest.ts

echo "🏁 Batch scoring jobs"
bun ./src/scoring.ts

echo "🏁 Evaluate jobs"
bun ./src/evaluation.ts
