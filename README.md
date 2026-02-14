# apply-agent wip

Self-hosted job scraper runner with self-hosted LLM-powered CV matching.

⚠️ It’s possible to filter out legitimate jobs, so use it with caution.

## What’s happening

Helps you find jobs to apply for. 👷💭

### Folder structure

Every job is a _markdown_ file. During the evaluation process, it gets updated with notes and travels between status folders. No database required.

Here is the folder sctructure for `./[job].md` files for further process structure:

```
data/jobs/
     ├── inbox/             # raw scraped jobs (unscored)
     ├── screened_out/      # rejected by batch scoring
     ├── shortlisted/       # passed batch scoring
     ├── awaiting_input/    # agent needs human input
     ├── declined/          # rejected by agent reasoning
     └── approved/          # agent-approved jobs
```

### What’s **automatised**

| Get jobs                       | Filter the noise out                 | Challenge a job            |
| ------------------------------ | ------------------------------------ | -------------------------- |
| 1️⃣ Visit a jobsite              | 1️⃣ Get a jobs CSV from **inbox**      | Agent compare with yout CV |
| 2️⃣ Search jobs by criteria      | 2️⃣ Run batch scoring with a light LLM |                            |
| 3️⃣ Download as CSV to **inbox** | 👎 Unrealistic to **screened_out**    |                            |
|                                | 👍 Good ones to **shortlisted**       |                            |


> Batch reject:\
> _“**Not worth thinking **about****”_
> 
> Agent reject:\
> _“**Thought about it carefully and decided no**”_

## Run without Docker

This is the hard way, the best for low-level machines. If you're not a developer, probably need to install required dependencies on your machine.

### Requirements

- **Linux**/_Mac_/~~_Windows_~~

  (WSL welcome)

- **Bun JavaScript**

  [Install](https://bun.com/docs/installation#installation) the latest(?) version.
  Node.js is not supported.

- **Python**
  
  Need version 3.10+.
  Runs the 3rd-party [scraper](https://github.com/speedyapply/JobSpy).

- **LM Studio**

  Recommended to increase model’s default context window to 8192.

  Default (required) models:
  - qwen/qwen3-4b-2507
  - qwen3-0.6b-mlx

### Custom configuration

The predefined LLM API _base URL_ is expecting a local running [LM Studio](https://lmstudio.ai/), with the loadable models. The default models are CPU friendly, selected for bare minimum setup, but the result can be better.

Actually any [Open AI **compatible**](https://www.npmjs.com/package/@ai-sdk/openai-compatible) host should work, with any LLM models. Change the default configutation to discover.

Create `.env.local` with any of these lines:

```ini
AI_API_BASE_URL=[open ai api endpoint]
AGENT_MODEL=[strong model for agentic run]
BATCH_MODEL=[light model for intanse run]
```

### Installation

First of all, clone the project.

Install JavaScript dependencies:

```bash
bun install
```

The post-install script validates config and install other requirements.

Create the `data/cv.md` file with your data.

### Retrieve fresh jobs

Scrape the configured search on selected job boards and for new listings.

```bash
./tools/scrape.sh
```

It creates the jobs CSV in the `data/jobs/inbox` folder.

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

## Etc.

### Data flow

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

### Agent states

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
DECIDE <───> WAIT_FOR_HUMAN
  ↓               |
 PLAN             |
  ↓               ↓
 DONE            ERROR
```

### Mode semantics

The agent runs in strict mode by default. Add the parameter __**x**__ — `bun start run x` — to start in exploratory mode (no questions).

| Strict                                       | Exploratory                               |
| -------------------------------------------- | ----------------------------------------- |
| Any unresolved uncertainty → WAIT_FOR_HUMAN  | Hard gaps → ask once, then proceed        |
| Hard gaps → WAIT_FOR_HUMAN                   | Low confidence → assume best-case         |
| Low confidence → WAIT_FOR_HUMAN              | LOW_QUALITY → downgrade severity, proceed |
| LOW_QUALITY from EVALUATE/CHALLENGE → FAILED | Bias toward PLAN                          |
