#!/usr/bin/env python3
"""Build public BuildFixBench data artifacts from the source YAML file."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import date
from pathlib import Path

import yaml


HIDDEN_FIELDS = {"fixed_state"}


def normalize_category(value: object) -> str:
    text = str(value or "").strip()
    if ":" in text:
        text = text.split(":", 1)[0]
    return text.upper()


def load_records(path: Path) -> list[dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        records = yaml.safe_load(handle) or []
    if not isinstance(records, list):
        raise ValueError(f"{path} must contain a YAML list")
    return records


def sanitize_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    sanitized = []
    for index, record in enumerate(records, start=1):
        if not isinstance(record, dict):
            raise ValueError(f"record {index} is not a mapping")
        public_record = {
            key: value
            for key, value in record.items()
            if key not in HIDDEN_FIELDS
        }
        public_record["error_category"] = normalize_category(
            public_record.get("error_category")
        )
        sanitized.append(public_record)
    return sanitized


def make_summary(records: list[dict[str, object]]) -> dict[str, object]:
    years = [
        str(record.get("error_time", ""))[:4]
        for record in records
        if record.get("error_time")
    ]
    return {
        "total_cases": len(records),
        "projects": len({record.get("project") for record in records if record.get("project")}),
        "languages": dict(Counter(record.get("language", "unknown") for record in records)),
        "error_categories": dict(
            Counter(record.get("error_category", "unknown") for record in records)
        ),
        "years": dict(Counter(year for year in years if year)),
    }


def write_yaml(path: Path, records: list[dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(
            records,
            handle,
            allow_unicode=False,
            default_flow_style=False,
            sort_keys=False,
            width=100,
        )


def write_json(path: Path, records: list[dict[str, object]], version: str) -> None:
    payload = {
        "name": "BuildFixBench",
        "version": version,
        "generated_at": date.today().isoformat(),
        "summary": make_summary(records),
        "records": records,
    }
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="source projects.yaml")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--version", default="v0.1")
    args = parser.parse_args()

    records = sanitize_records(load_records(args.source))
    args.data_dir.mkdir(parents=True, exist_ok=True)
    write_yaml(args.data_dir / "projects.yaml", records)
    write_json(args.data_dir / "projects.json", records, args.version)


if __name__ == "__main__":
    main()
