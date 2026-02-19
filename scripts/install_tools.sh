#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------------------------
# Setup Python virtual environment and install dependencies
# ------------------------------------------------------------------------------

# Jump to the folder where this script lives (tools/), then into scraper/
cd "$(dirname "$0")/../tools/scraper"

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
