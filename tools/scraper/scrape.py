import csv
from os import environ
from pathlib import Path
from dotenv import dotenv_values
from jobspy import scrape_jobs

base = Path(__file__).parents[2]
config = {
    # Order sync behaviour align with setup.sh
    **environ,
    **dotenv_values(base / ".env"),
    **dotenv_values(base / ".env.local"),
}

output_csv = Path(config.get("JOBS_DIR")) / "inbox" / "jobs.csv"

jobs = scrape_jobs(
    site_name=["linkedin"],
    # site_name=["indeed"],
    # linkedin_fetch_description=True,
    search_term="rust dev",
    # search_term="typescript",
    location="London, UK",
    results_wanted=5,
    # results_wanted=50,
    # hours_old=72
)

print(f"Found {len(jobs)} jobs")
if len(jobs) > 0:
    jobs.to_csv(output_csv, quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
    print(jobs.head())
