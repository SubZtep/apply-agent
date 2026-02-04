#!/bin/bash

# Go to project root (parent of tools/)
cd "$(dirname "$0")/.."

# Activate venv (relative to project root)
source tools/scraper/venv/bin/activate

# Run script from project root so it can find data/jobs/inbox
python tools/scraper/scrape.py
