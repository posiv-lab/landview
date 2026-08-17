#!/usr/bin/env python3
"""Convert official LSMD_CONT_UD620 SHP archives into web-ready GeoJSON.

The source archives are kept outside the repository and are never modified.
This script only accepts Seoul (11), Incheon (28), and Gyeonggi (41) records.
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
import zipfile
from pathlib import Path

import geopandas as gpd


SUPPORTED_REGIONS = {
    "11": "서울",
    "28": "인천",
    "41": "경기",
}


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() == "nan" else text


def format_date(value: object) -> str:
    digits = re.sub(r"[^0-9]", "", clean_text(value))
    if len(digits) != 8:
        return ""
    return f"{digits[:4]}-{digits[4:6]}-{digits[6:]}"


def fallback_name(alias: str, remark: str, notice_id: str, district_code: str) -> str:
    if alias:
        return alias
    complex_match = re.search(
        r"((?:서울|경기|인천)?\s*[^,()]+?\s*도심\s*공공주택\s*복합지구)",
        remark,
    )
    if complex_match:
        return re.sub(r"\s+", " ", complex_match.group(1)).strip()
    if remark and not re.search(r"(?:고시|승인|제\d+[-호])", remark):
        return remark
    short_id = notice_id[-12:] if notice_id else district_code
    return f"공공주택지구 ({short_id})"


def archive_month(path: Path) -> str:
    candidates = [path.stem]
    with zipfile.ZipFile(path) as archive:
        candidates.extend(archive.namelist())
    match = re.search(r"_(20\d{4})(?:\D|$)", " ".join(candidates))
    if not match:
        return ""
    value = match.group(1)
    return f"{value[:4]}-{value[4:]}"


def read_archive(path: Path) -> gpd.GeoDataFrame:
    with tempfile.TemporaryDirectory(prefix="landview-ud620-") as temp_dir:
        with zipfile.ZipFile(path) as archive:
            archive.extractall(temp_dir)
        shapefiles = list(Path(temp_dir).rglob("*.shp"))
        if len(shapefiles) != 1:
            raise ValueError(f"{path.name}: SHP 파일은 정확히 1개여야 합니다.")
        return gpd.read_file(shapefiles[0], encoding="cp949")


def convert(archives: list[Path]) -> dict[str, object]:
    features: list[dict[str, object]] = []

    for archive in archives:
        frame = read_archive(archive)
        required = {"ALIAS", "REMARK", "NTFDATE", "COL_ADM_SE", "MNUM", "geometry"}
        missing = required.difference(frame.columns)
        if missing:
            raise ValueError(f"{archive.name}: 필수 필드 누락: {', '.join(sorted(missing))}")
        if frame.crs is None:
            raise ValueError(f"{archive.name}: 좌표계 정보가 없습니다.")

        source_month = archive_month(archive)
        projected = frame.to_crs("EPSG:5186")
        areas = projected.geometry.area.round().astype(int)
        projected.geometry = projected.geometry.simplify(1.0, preserve_topology=True)
        web_frame = projected.to_crs("EPSG:4326")

        for index, row in web_frame.iterrows():
            district_code = clean_text(row["COL_ADM_SE"])
            region_code = district_code[:2]
            if region_code not in SUPPORTED_REGIONS or row.geometry is None or row.geometry.is_empty:
                continue

            alias = clean_text(row["ALIAS"])
            remark = clean_text(row["REMARK"])
            notice_id = clean_text(row["MNUM"])
            project_name = fallback_name(alias, remark, notice_id, district_code)
            geometry = json.loads(gpd.GeoSeries([row.geometry], crs="EPSG:4326").to_json())["features"][0]["geometry"]
            min_longitude, min_latitude, max_longitude, max_latitude = row.geometry.bounds

            features.append(
                {
                    "type": "Feature",
                    "id": notice_id or f"{district_code}-{index}",
                    "geometry": geometry,
                    "properties": {
                        "projectName": project_name,
                        "projectType": "공공주택지구",
                        "regionName": SUPPORTED_REGIONS[region_code],
                        "districtCode": district_code,
                        "noticeDate": format_date(row["NTFDATE"]),
                        "noticeId": notice_id,
                        "remark": remark,
                        "areaSquareMeters": int(areas.loc[index]),
                        "bounds": [
                            round(min_longitude, 7),
                            round(min_latitude, 7),
                            round(max_longitude, 7),
                            round(max_latitude, 7),
                        ],
                        "sourceName": "국토교통부 공공주택지구 공간정보",
                        "sourceBaseDate": source_month,
                        "sourceFile": archive.name,
                    },
                }
            )

    features.sort(
        key=lambda feature: (
            feature["properties"]["regionName"],
            feature["properties"]["projectName"],
            feature["id"],
        )
    )
    return {
        "type": "FeatureCollection",
        "features": features,
        "total": len(features),
        "truncated": False,
        "metadata": {
            "scope": ["서울", "경기", "인천"],
            "sourceFormat": "LSMD_CONT_UD620 SHP",
            "generatedBy": "scripts/convert-development-projects.py",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archives", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    for archive in args.archives:
        if not archive.is_file():
            parser.error(f"파일을 찾을 수 없습니다: {archive}")
        if "LSMD_CONT_UD620" not in archive.name:
            parser.error(f"UD620 자료가 아닙니다: {archive.name}")

    payload = convert(args.archives)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{len(payload['features'])}개 구역 생성: {args.output}")


if __name__ == "__main__":
    main()
