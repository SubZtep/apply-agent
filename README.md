# apply-agent ~~👷💭~~ <sup>noname</sup>[^1]_+_<sub>**wip**</sub>

Self-hosted job scraper runner, with self-hosted LLM-powered CV matching.

> [!CAUTION]
> 🍪 It’s possible to filter out legitimate jobs, so use it with caution.

## What’s automated

There are three main processes. They can even run in parallel, and if something is ambiguous, the agent asks the user.

| Get Jobs                | Filter Out the Noise | Evaluate                        |
| ----------------------- | -------------------- | ------------------------------- |
| Visit a job site        | Process jobs CSV     | Process shortlisted jobs        |
| Search by criteria      | Run batch scoring    | Put them into the state machine |
| Download results as CSV | Generate job JSONs   | Enjoy approved jobs             |
| `--step=scrape`         | `--step=batch`       | `--step=evaulate`               |

```bash
$ bun start run --help

USAGE
  apply-agent run [OPTIONS]

OPTIONS
  --mode=<exploratory|strict>
      Exploratory: AI-driven.
      Strict (default): human-in-the-loop.

  --step=<scrape|batch|evaluate|answers>
      If omitted, the orchestrator runs all scheduled steps.
```

## How’s it going?

Batch reject:\
_“**Not worth thinking about.**”_

Agent reject:\
_“**Thought about it carefully and decided no.**”_

## Documentation

Go to the [index page](./docs/index.md) (already legacy).

[^1]: <ins>Apply</ins> in the repo name is confusing — it doesn’t actually do anything.
