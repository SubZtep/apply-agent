# apply-agent ~~👷💭~~ <sup>noname</sup>[^1]_+_<sub>**wip**</sub>

Self-hosted job scraper runner, with self-hosted LLM-powered CV matching.

> [!CAUTION]
> 🍪 It’s possible to filter out legitimate jobs, so use it with caution.

## What’s automated

There are three main automated processes. They can run in parallel. If something is ambiguous, the user needs to answer a few questions.

| Get Jobs           | Filter Out the Noise       | Evaluate                        |
| ------------------ | -------------------------- | ------------------------------- |
| Visit a job site   | Process scraped jobs       | Process shortlisted jobs        |
| Search by criteria | Run batch scoring          | Put them into the state machine |
| Download results   | Screen out irrelevant jobs | Enjoy approved jobs             |

## Flow

1. Clear job folders

    ```bash
    rm -rv ./data/jobs/*
    ```

2. Setup project

    ```bash
    ./scripts/install.sh
    ```

3. Scrape jobs

    ```bash
    ./tools/scraper/run.sh
    ```

4. Pre-process scraped jobs

    ```bash
    bun cli ingest
    ```

5. Batch scoring jobs

    ```bash
    bun cli scoring
    ```

6. Evaluate jobs

    ```bash
    bun cli evalution
    ```

7. Answer questions

    ```bash
    bun cli answer
    ```

    After answering, don’t forget to re-evaluate jobs.

### Run a process

```bash
$ bun cli
Run a single step.

USAGE
  bun cli <ingest|scoring|evalution|answer> [job-id]
```

### Run orchestrator

Runs indefinitely, except for the answers step.

```bash
bun start
```

## How’s it going?

Batch reject:\
_“**Not worth thinking about.**”_

Agent reject:\
_“**Thought about it carefully and decided no.**”_

## Documentation

Go to the [index page](./docs/index.md) (already legacy).

[^1]: <ins>Apply</ins> in the repo name is confusing — it doesn’t actually do anything.
