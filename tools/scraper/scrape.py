from os import environ
from pathlib import Path
from yaml import safe_load
from jobspy import scrape_jobs
from dotenv import dotenv_values
from csv import QUOTE_NONNUMERIC

base = Path(__file__).parents[2]
config = {
    **environ,
    **dotenv_values(base / ".env"),
    **dotenv_values(base / ".env.local"),
}

with open(base / config.get("CONFIG_FILE"), "r") as file:
    user_config = safe_load(file)

jobs = scrape_jobs(**user_config["jobspy"])
print(f"Found {len(jobs)} jobs")

if len(jobs) > 0:
    output_csv = Path(config.get("JOBS_DIR")) / "inbox" / "jobs.csv"
    jobs.to_csv(output_csv, quoting=QUOTE_NONNUMERIC, escapechar="\\", index=False)
