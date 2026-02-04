import csv
from pathlib import Path

from jobspy import scrape_jobs

output_csv = Path(__file__).parents[2] / "data" / "jobs" / "inbox" / "jobs.csv"

jobs = scrape_jobs(
    site_name=["linkedin"],
    # linkedin_fetch_description=True,
    search_term="typescript",
    location="London, UK",
    results_wanted=50,
    # hours_old=72
)

print(f"Found {len(jobs)} jobs")
if len(jobs) > 0:
    jobs.to_csv(output_csv, quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
    print(jobs.head())
