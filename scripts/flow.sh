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
bun ./src/ingest_jobs.ts

echo "🏁 Score a job"
bun ./src/score_job.ts

echo "🏁 Evaluate a job"
bun ./src/evaluate_job.ts
