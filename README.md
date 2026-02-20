# apply-agent ~~👷💭~~ <sup>noname</sup>[^1]_+_<sub>**wip**</sub>

Self-hosted job scraper runner, with self-hosted LLM-powered CV matching.

> [!CAUTION]
> 🍪 It’s possible to filter out legitimate jobs, so use it with caution.

## What’s automated

There are three main automated processes. They can run in parallel.

| Get Jobs           | Filter Out the Noise       | Evaluate                        |
| ------------------ | -------------------------- | ------------------------------- |
| Visit a job site   | Process scraped jobs       | Process shortlisted jobs        |
| Search by criteria | Run batch scoring          | Put them into the state machine |
| Download results   | Screen out irrelevant jobs | Enjoy approved jobs             |

If something is ambiguous, the user needs to answer a few questions.

## How’s it going?

Batch reject:\
_“**Not worth thinking about.**”_

Agent reject:\
_“**Thought about it carefully and decided no.**”_

## How to run?

The simplest way to run the project is with [Docker Compose](https://docs.docker.com/compose/install#docker-desktop-recommended). It automatically sets up local LLM models (CPU-only for now) and starts searching for jobs right away. You’ll need about 4 GB of disk space with the default settings. Clone the repository and run:

```bash
docker compose up
```

## Documentation

Go to the [index page](./docs/index.md) (already legacy :trollface:).

[^1]: <ins>Apply</ins> in the repo name is confusing — it doesn’t actually do anything.
