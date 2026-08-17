#!/usr/bin/env python3
"""Add representative VWorld coordinates to a LandView project collection."""

from __future__ import annotations

import argparse
import json
import os
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


VWORLD_SEARCH_URL = "https://api.vworld.kr/req/search"


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def queries(project: dict[str, object], region_name: str) -> list[str]:
    district = str(project.get("districtName") or "").strip()
    location = str(project.get("location") or "").strip()
    road_address = str(project.get("roadAddress") or "").strip()
    candidates = []
    for address in (location, road_address):
        if not address or address == "-":
            continue
        base = f"{region_name} {district} {address}".strip()
        simplified = re.sub(r"\([^)]*\)", " ", base)
        simplified = re.sub(r"([가-힣]+)\d+동", r"\1동", simplified)
        simplified = re.sub(r"([로길])\s+(\d+번길)", r"\1\2", simplified)
        simplified = re.sub(r"\s+", " ", simplified).strip()
        first_lot = re.split(r"[,~]|\s및\s|\s외\s", simplified, maxsplit=1)[0]
        first_lot = re.sub(r"(?:번지)?\s*(?:일원|일대)$", "", first_lot).strip()
        candidates.extend((base, simplified, first_lot))
    return list(dict.fromkeys(candidate for candidate in candidates if candidate))


def geocode(
    api_key: str, project: dict[str, object], region_name: str
) -> dict[str, object] | None:
    for query in queries(project, region_name):
        for category in ("parcel", "road"):
            params = urllib.parse.urlencode(
                {
                    "service": "search",
                    "request": "search",
                    "version": "2.0",
                    "crs": "EPSG:4326",
                    "size": "3",
                    "page": "1",
                    "query": query,
                    "type": "address",
                    "category": category,
                    "format": "json",
                    "errorformat": "json",
                    "key": api_key,
                }
            )
            request = urllib.request.Request(
                f"{VWORLD_SEARCH_URL}?{params}",
                headers={"Accept": "application/json", "User-Agent": "LandView updater"},
            )
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    payload = json.load(response)
            except (OSError, ValueError):
                continue

            if payload.get("response", {}).get("status") != "OK":
                continue
            items = payload.get("response", {}).get("result", {}).get("items", [])
            for item in items:
                parcel_address = str(item.get("address", {}).get("parcel") or "")
                if region_name not in parcel_address:
                    continue
                point = item.get("point", {})
                try:
                    longitude = float(point["x"])
                    latitude = float(point["y"])
                except (KeyError, TypeError, ValueError):
                    continue
                return {
                    "latitude": latitude,
                    "longitude": longitude,
                    "matchedAddress": parcel_address,
                    "query": query,
                    "source": "국토교통부 VWorld 주소검색",
                }
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--region-name", required=True)
    parser.add_argument("--env-file", default=Path(".env"), type=Path)
    parser.add_argument("--workers", default=6, type=int)
    args = parser.parse_args()

    load_env(args.env_file)
    api_key = os.environ.get("VWORLD_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("VWORLD_API_KEY가 필요합니다.")

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    projects = payload.get("projects", [])
    pending = [project for project in projects if not project.get("center")]
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 10))) as executor:
        futures = {
            executor.submit(geocode, api_key, project, args.region_name): project
            for project in pending
        }
        for future in as_completed(futures):
            center = future.result()
            if center:
                futures[future]["center"] = center

    geocoded_count = sum(1 for project in projects if project.get("center"))
    payload.setdefault("metadata", {})["geocoding"] = {
        "source": "국토교통부 VWorld 주소검색",
        "geocoded": geocoded_count,
        "unmatched": len(projects) - geocoded_count,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"대표 위치 {geocoded_count}/{len(projects)}건 저장: {args.output}")


if __name__ == "__main__":
    main()
