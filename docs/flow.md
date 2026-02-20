## Flow

1. Clear job folders

    ```bash
    rm -rv ./data/jobs/*
    ```

2. Setup project

    ```bash
    ./scripts/install.sh
    ```

    - Install Python requirements venv

      ```bash
      ./scripts/install_tools.sh
      ```

3. Scrape jobs

    - Enable virtual environment locally

      ```bash
      source tools/scraper/venv/bin/activate
      ```

    ```bash
    python tools/scraper/scrape.py
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
