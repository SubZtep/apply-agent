## Setup Python

```bash
python3.12 -m venv tools/scraper/venv]
source tools/scraper/venv/bin/activate
pip install -r tools/scraper/requirements.txt
```

### Run a process

```bash
$ bun cli
Run a single step.

USAGE
  bun cli <ingest|scoring|evaluation|answer> [job-id]
```

## Run orchestrator

Runs indefinitely, except for the answers step.

```bash
bun start
```
