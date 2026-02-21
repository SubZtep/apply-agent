from __future__ import annotations
import sys
from pandas import DataFrame
from logger import log
from jobspy import scrape_jobs


def get_jobs(jobspy_cfg: dict, limit: int, offset: int) -> DataFrame:
    try:
        jobs = scrape_jobs(**jobspy_cfg, results_wanted=limit, offset=offset).fillna("")
    except Exception as exc:
        log.exception("scrape_jobs failed: %s", exc)
        sys.exit(1)

    noMoreJobs = len(jobs) < limit

    """
    Filter out jobs where description is empty string
    """
    if hasattr(jobs, "to_dict"):
        jobs = jobs[jobs["description"].str.strip() != ""]

    if noMoreJobs:
        log.info("No jobs found, exiting.")
        sys.exit()

    return jobs
