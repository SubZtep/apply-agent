# :construction_worker:

Find your perfect job offers based on your CV.

```
data/jobs/
  inbox/             # raw scraped jobs (unscored)
  screened_out/      # rejected by batch scoring
  shortlisted/       # passed batch scoring
  awaiting_input/    # agent needs human input
  declined/          # rejected by agent reasoning
  approved/          # agent-approved jobs
```

> Batch reject: _“Not worth thinking about”_ \
> Agent reject: _“Thought about it carefully and decided no”_

## Requirements

- Bun (latest?)
- Python 3.10+
- [LM Studio](https://lmstudio.ai/), required (CPU friendly) models:
  - qwen/qwen3-4b-2507
  - qwen3-0.6b-mlx

:pray::whale:

## Run scripts

Run the scripts from the project root directory (just in case).

### Installation

First of all, clone the project. Create the `data/cv.md` file with your data, ~~config,~~ run the following scripts.

```bash
bun install
./tools/install.sh
```

### Retrieve fresh jobs

Scrape the configured search on selected job boards and for new listings.

```bash
./tools/scrape.sh
```

It creates the jobs in the `data/jobs/inbox` folder. 

### Run batch scorer

Quickly filter out the obvious no-gos.

```bash
bun run score_batch
```

It moves the possible jobs to the `data/jobs/shortlisted` folder, and the others to the `data/jobs/screened_out` one.

### Run the agent

```bash
bun start run
```

If the agens is ambiguous about a job post, it will set some questions and move the job to the `data/jobs/awaiting_input` folder. Answer questions to resolve ambiguous job posts.

The id parameter will be the output of the _run_ script. Use `--force-proceed` to auto-accept the answers to approve.

```bash
bun start resume <id> [--force-proceed]
```

Move the potential jobs to `data/jobs/approved`, and the less interesting ones to `data/jobs/declined`.

## Data flow

```
[ Python scraper ]
        ↓
  (job records)
        ↓
[ job inbox (files) ]
        ↓
[ batch scorer ]
        ↓
[ ranked jobs ]
        ↓
[ agent runs ]
```

## Agent states

```
IDLE
  ↓
INGEST
  ↓
NORMALIZE
  ↓
EVALUATE
  ↓
CHALLENGE
  ↓
DECIDE ───→ WAIT_FOR_HUMAN
  ↓               ↑
 PLAN ────────────┘
  ↓
 DONE
```

## Mode semantics

The agent runs in strict mode by default. Add the parameter __**x**__ — `bun start run x` — to start in exploratory mode (no questions).

| Strict                                       | Exploratory                               |
| -------------------------------------------- | ----------------------------------------- |
| Any unresolved uncertainty → WAIT_FOR_HUMAN  | Hard gaps → ask once, then proceed        |
| Hard gaps → WAIT_FOR_HUMAN                   | Low confidence → assume best-case         |
| Low confidence → WAIT_FOR_HUMAN              | LOW_QUALITY → downgrade severity, proceed |
| LOW_QUALITY from EVALUATE/CHALLENGE → FAILED | Bias toward PLAN                          |

---

## Notes

If the future feature is CV generator, [pdfmake](https://github.com/bpampuch/pdfmake) or [reactive-resume](https://github.com/amruthpillai/reactive-resume) could be good candidates. :shipit:
