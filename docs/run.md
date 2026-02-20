## Install

### Bun

[Follow](https://bun.com/get) the instructions. 🤓

### Python

Use a stable Python version (3.11, 3.12, or 3.13) due to NumPy compatibility.

```bash
python3.12 -m venv tools/scraper/venv
source tools/scraper/venv/bin/activate
pip install -r tools/scraper/requirements.txt
```

## Run

### A single process

```bash
$ bun cli
Run a single step.

USAGE
  bun cli <ingest|scoring|evaluation|answer> [job-id]
```

### The orchestrator

Runs indefinitely, except for the answers step.

```bash
bun start
```

### Verbose

Monitor jobs folder to see the jobs actualy state.

```bash
bun lt
```
