# User Configuration

There are three config files the user can configure. Running `./scripts/install.sh` in the project root creates basic placeholder versions, but they require some tuning to produce reliable results.

## ⛓️ .env.local

The original [`.env`](../.env) file with the project’s environment variables is part of the repository and contains sensible defaults for LLM APIs and local paths. To override any value, create a `.env.local` file with your local configuration.

## ⛓️ config.yaml

Job search parameters live under the **`jobspy` root node**.

This object is passed to the scraper function. The exact location of the configuration is defined by the `CONFIG_FILE` environment variable.

See the full [parameter list](https://github.com/speedyapply/JobSpy?tab=readme-ov-file#parameters-for-scrape_jobs) to find the right (**working**) settings.

Example:

```yaml
jobspy:
  site_name:
    - linkedin
    # - zip_recruiter
    - indeed
    # - glassdoor
    # - google
    # - bayt
    # - bdjobs
  search_term: software engineer
  location: London
  country_indeed: UK
  results_wanted: 10
  # hours_old: 72
  verbose: 0
```

## ⛓️ cv.md

The CV location is defined by the `CV_FILE` environment variable. The file should be in _Markdown_ format. The better the CV, the better the job matches.

# Mode semantics

The agent runs in strict mode by default. To skip questions, set the mode to _exploratory_.

| Strict                                       | Exploratory                               |
| -------------------------------------------- | ----------------------------------------- |
| Any unresolved uncertainty → WAIT_FOR_HUMAN  | Hard gaps → ask once, then proceed        |
| Hard gaps → WAIT_FOR_HUMAN                   | Low confidence → assume best-case         |
| Low confidence → WAIT_FOR_HUMAN              | LOW_QUALITY → downgrade severity, proceed |
| LOW_QUALITY from EVALUATE/CHALLENGE → FAILED | Bias toward PLAN                          |
