#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------------------------
# Setup Python virtual environment and install dependencies
# ------------------------------------------------------------------------------

cd "$(dirname "$0")/.."

# Ensure Python venv exists inside tools/scraper/venv
if [ ! -d "tools/scraper/venv" ]; then
  python3.12 -m venv tools/scraper/venv
fi

# Activate the virtual environment
source tools/scraper/venv/bin/activate

# Install Python dependencies into the venv
pip install -r tools/scraper/requirements.txt
