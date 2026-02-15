## User Configuration

There are three config files the user can configure. Running `bun i` in the project root creates basic placeholder versions, but they require some tuning to produce reliable results.

### ⛓️ .env.local

The original [`.env`](../.env) file with the project’s environment variables is part of the repository and contains sensible defaults for LLM APIs and local paths. To override any value, create a `.env.local` file with your local configuration.

### ⛓️ config.yaml

Job search parameters live under the **`jobspy` root node**. This object is passed to the scraper function. The exact location of the configuration is defined by the `CONFIG_FILE` environment variable. See the full [list of arguments](https://github.com/speedyapply/JobSpy?tab=readme-ov-file#parameters-for-scrape_jobs) for details.

### ⛓️ cv.md

The CV location is defined by the `CV_FILE` environment variable. The file should be in _Markdown_ format. The better the CV, the better the job matches.
