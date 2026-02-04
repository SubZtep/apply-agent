import csv
from jobspy import scrape_jobs
from pathlib import Path

output_csv = Path(__file__).parents[2] / "data" / "jobs" / "inbox" / "jobs.csv"

jobs = scrape_jobs(
  site_name=["linkedin"],
  # linkedin_fetch_description=True,
  search_term="typescript",
  location="London, UK",
  results_wanted=20,
  # hours_old=72
)

print(f"Found {len(jobs)} jobs")
print(jobs.head())
jobs.to_csv(output_csv, quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False)
