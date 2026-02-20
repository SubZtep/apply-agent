from __future__ import annotations

import logging
import os
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import yaml
from dotenv import dotenv_values
from jobspy import scrape_jobs


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s – %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


def load_env_config(root: Path) -> Mapping[str, str]:
    # Capture system environment variables before loading any files
    # These take precedence and cannot be overwritten by .env files
    system_keys = set(os.environ.keys())

    # Load files in order: .env first, then .env.local
    # .env.local will override .env for variables not in system environment
    file_values: dict[str, str] = {}

    for fname in (".env", ".env.local"):
        fpath = root / fname
        if not fpath.is_file():
            log.debug("Optional env file %s not present", fpath)
            continue

        values = dotenv_values(fpath)
        log.debug("Loaded %s", fpath)

        # Only accept keys not already defined in system environment
        for key, value in values.items():
            if key not in system_keys:
                file_values[key] = value

    # Combine: Start with system environment, then add file-derived values
    # (Files cannot override system, but .env.local overrides .env)
    cfg = dict(os.environ)
    cfg.update(file_values)

    whitelist = {"CONFIG_FILE", "JOBS_DIR"}  # extend as required
    cfg = {k: v for k, v in cfg.items() if k in whitelist}
    return cfg


def load_user_config(path: Path) -> dict[str, Any]:
    """Read a YAML file safely, with helpful error messages."""
    if not path.is_file():
        raise FileNotFoundError(f"YAML config not found: {path}")

    try:
        with path.open("r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh) or {}
        if not isinstance(data, dict):
            raise ValueError("Root of YAML config must be a mapping")
        return data
    except yaml.YAMLError as exc:
        raise ValueError(f"Invalid YAML in {path}: {exc}") from exc


def main() -> None:
    base_dir = Path(__file__).parents[2]  # this file is in 2 folders deep
    cfg = load_env_config(base_dir)

    yaml_path = base_dir / cfg.get("CONFIG_FILE", "config.yaml")
    user_cfg = load_user_config(yaml_path)

    jobspy_cfg = user_cfg.get("jobspy")
    if not isinstance(jobspy_cfg, dict):
        log.error("Missing or malformed `jobspy` section in %s", yaml_path)
        sys.exit(1)

    try:
        jobs = scrape_jobs(**jobspy_cfg)
    except Exception as exc:
        log.exception("scrape_jobs failed: %s", exc)
        sys.exit(1)

    # Filter out jobs where description is None or empty string
    if hasattr(jobs, "to_dict"):  # jobs is likely a pandas.DataFrame
        jobs = jobs[
            jobs["description"].notnull() & (jobs["description"].str.strip() != "")
        ]

    if len(jobs) == 0:
        log.info("No jobs found, exiting.")
        sys.exit()

    jobs_dir = Path(cfg.get("JOBS_DIR", "jobs")) / "inbox"
    jobs_dir.mkdir(parents=True, exist_ok=True)
    out_path = jobs_dir / "jobs.json"
    try:
        jobs.to_json(
            path_or_buf=out_path,
            orient="records",
            indent=2,
            force_ascii=False,
        )
        log.info("Wrote %d jobs to %s", len(jobs), out_path)
    except Exception as exc:
        log.exception("Failed to write jobs JSON: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
