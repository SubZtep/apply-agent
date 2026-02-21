from __future__ import annotations
import os
import sys
from collections.abc import Mapping
from pathlib import Path
from typing import Any
from logger import log
import yaml
from dotenv import dotenv_values


def load_env_config(root: Path) -> Mapping[str, str]:
    """
    Capture system environment variables before loading any files
    These take precedence and cannot be overwritten by .env files
    """
    system_keys = set(os.environ.keys())

    """
    Load files in order: .env first, then .env.local
    .env.local will override .env for variables not in system environment
    """
    file_values: dict[str, str] = {}

    for fname in (".env", ".env.local"):
        fpath = root / fname
        if not fpath.is_file():
            log.debug("Optional env file %s not present", fpath)
            continue

        values = dotenv_values(fpath)
        log.debug("Loaded %s", fpath)

        """
        Only accept keys not already defined in system environment
        """
        for key, value in values.items():
            if key not in system_keys:
                file_values[key] = value

    """
    Combine: Start with system environment, then add file-derived values
    (Files cannot override system, but .env.local overrides .env)
    """
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


base_dir = Path(__file__).parents[2]  # this file is in 2 folders deep
cfg = load_env_config(base_dir)

yaml_path = base_dir / cfg.get("CONFIG_FILE", "config.yaml")
user_cfg = load_user_config(yaml_path)

jobspy_cfg = user_cfg.get("jobspy")
if not isinstance(jobspy_cfg, dict):
    log.error("Missing or malformed `jobspy` section in %s", yaml_path)
    sys.exit(1)
