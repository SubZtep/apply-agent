# apply-agent ~~👷💭~~ noname[^1]_+_**wip** 

Self-hosted job scraper runner, with self-hosted LLM-powered CV matching.

## What’s automated

There are three main processes, and the orchestrator mode runs them automatically.

| Get Jobs                  | Filter Out the Noise | Evaluate                          |
| ------------------------- | -------------------- | --------------------------------- |
| 1️⃣ Visit a job site        | 1️⃣ Process jobs CSV   | 1️⃣ Process shortlisted jobs        |
| 2️⃣ Search by criteria      | 2️⃣ Run batch scoring  | 2️⃣ Put them into the state machine |
| 3️⃣ Download results as CSV | 3️⃣ Generate job JSONs | 3️⃣ Enjoy approved jobs             |

### How’s it going?

Batch reject:\
_“**Not worth thinking about.**”_

Agent reject:\
_“**Thought about it carefully and decided no.**”_

> [!CAUTION]
> It’s possible to filter out legitimate jobs, so use it with caution.

## CLI

```bash
bun start --help
```

## Documentation

Go to the [index page](./docs/index.md) (already legacy).

[^1]: <ins>Apply</ins> in the repo name is confusing — it doesn’t actually do anything.
