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

Actually any [Open AI **compatible**](https://ai-sdk.dev/providers/openai-compatible-providers) host should work, with any LLM models. Change the default configutation to discover.

Create `.env.local` with any of these lines:

```ini
OPENAI_API_BASE_URL=[open ai api endpoint]
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
