from __future__ import annotations
import sys
import time
from pathlib import Path
from logger import log
from config import jobspy_cfg, cfg
import scrape


def main() -> None:
    log.info("JobSpy config %s", jobspy_cfg)

    jobs_dir = Path(cfg.get("JOBS_DIR", "jobs")) / "inbox"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    out_path = jobs_dir / "jobs.json"

    offset = 0
    limit = 10

    while offset < 100:
        log.info("Run JobSpy, limit: %d, offset: %d", limit, offset)
        jobs = scrape.get_jobs(jobspy_cfg, limit, offset)

        try:
            jobs.to_json(
                path_or_buf=out_path,
                mode="a",
                lines=True,
                orient="records",
                force_ascii=False,
            )
            log.info("Appended %d jobs to %s", len(jobs), out_path)
        except Exception as exc:
            log.exception("Failed to write jobs JSON: %s", exc)
            sys.exit(1)

        offset += limit

        """
        Sleep 1-2 seconds like a reasonable scraper.
        """
        time.sleep(1 + (time.time() % 1))


if __name__ == "__main__":
    main()
