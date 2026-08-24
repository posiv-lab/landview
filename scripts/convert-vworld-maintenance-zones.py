#!/usr/bin/env python3
"""Convert VWorld UD602 maintenance-district SHP to web GeoJSON.

The official source is VWorld dataset 30335, `(연속주제)_도시및주거환경정비/정비구역`.
It contains districts designated and announced under Article 16 of the Urban and
Residential Environment Improvement Act.  Download the current regional ZIP after
signing in to VWorld, then run:

    python scripts/convert-vworld-maintenance-zones.py \
      downloads/LSMD_CONT_UD602_경기.zip \
      --projects public/data/gyeonggi-maintenance-projects.json \
      --base-date 2026-08 \
      --output public/data/gyeonggi-legal-maintenance-zones.geojson

Matching rules are deliberately conservative:
1. an official project point contained by a district polygon;
2. a one-to-one area match within the same city/county, with <= 8% error and a
   sufficiently separated second-best candidate.

An unmatched polygon is still emitted as an official legal district, but no project
name or stage is invented.  This is particularly important for Suwon, whose source
location field is a serial number rather than an address.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import geopandas as gpd
    from shapely import make_valid
    from shapely.geometry import Point, mapping, shape
    from shapely.ops import unary_union
except ImportError as error:  # pragma: no cover - actionable CLI error
    raise SystemExit(
        "GIS 패키지가 필요합니다. `python -m pip install -r scripts/requirements-gis.txt`를 "
        "먼저 실행해 주세요."
    ) from error


SOURCE_NAME = "국토교통부 VWorld 도시및주거환경정비 정비구역(UD602)"
SOURCE_URL = "https://www.vworld.kr/dtmk/dtmk_ntads_s002.do?svcCde=MK&dsId=30335"
SOURCE_LICENSE = "공공누리 제4유형(출처표시·상업적 이용 금지·변경 금지)"
DEFAULT_PROJECTS = Path("public/data/gyeonggi-maintenance-projects.json")
DEFAULT_OUTPUT = Path("public/data/gyeonggi-legal-maintenance-zones.geojson")
GROUP_ID_COLUMNS = ("MNUM", "MNG_NO", "DGM_NO", "ZONE_ID", "OBJECTID")
DISTRICT_COLUMNS = ("COL_ADM_SE", "SIG_CD", "SIGNGU_SE", "SGG_CD")
NAME_COLUMNS = ("ALIAS", "DGM_NM", "ZONE_NM", "NAME", "DGM_NAME")
NOTICE_DATE_COLUMNS = ("NTFDATE", "NTFC_DATE", "NOTICE_DT")
DISTRICT_NAMES = {
    "41110": "수원시",
    "41130": "성남시",
    "41150": "의정부시",
    "41170": "안양시",
    "41190": "부천시",
    "41210": "광명시",
    "41220": "평택시",
    "41250": "동두천시",
    "41270": "안산시",
    "41280": "고양시",
    "41290": "과천시",
    "41310": "구리시",
    "41360": "남양주시",
    "41370": "오산시",
    "41390": "시흥시",
    "41410": "군포시",
    "41430": "의왕시",
    "41450": "하남시",
    "41460": "용인시",
    "41480": "파주시",
    "41500": "이천시",
    "41550": "안성시",
    "41570": "김포시",
    "41590": "화성시",
    "41610": "광주시",
    "41630": "양주시",
    "41650": "포천시",
    "41670": "여주시",
    "41800": "연천군",
    "41820": "가평군",
    "41830": "양평군",
}


def clean(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "null"} else text


def number(value: Any) -> float | None:
    try:
        parsed = float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) and parsed > 0 else None


def normalize_name(value: str) -> str:
    text = re.sub(r"\([^)]*\)", "", value or "").replace(" ", "")
    return re.sub(r"[^0-9A-Za-z가-힣]", "", text)


def find_column(columns: list[str], candidates: tuple[str, ...]) -> str | None:
    index = {column.upper(): column for column in columns}
    return next((index[name] for name in candidates if name in index), None)


def district_code_from_project(project: dict[str, Any]) -> str:
    explicit = clean(project.get("districtCode"))
    if re.fullmatch(r"41\d{3}", explicit):
        return explicit
    for value in (project.get("id"), project.get("sourceRecordId")):
        match = re.search(r"(?:gyeonggi-)?(41\d{3})[-_]", clean(value))
        if match:
            return match.group(1)
    return ""


def category(project_type: str) -> str:
    if "재건축" in project_type:
        return "reconstruction"
    if "주거환경" in project_type:
        return "residential"
    if "재개발" in project_type:
        return "redevelopment"
    return "legal-zone"


def fallback_zone_name(district_code: str, source_id: str) -> str:
    district = DISTRICT_NAMES.get(district_code, "경기")
    date_match = re.search(r"(20\d{6})", source_id)
    notice_id = date_match.group(1) if date_match else "고시"
    serial_match = re.search(r"(\d{4})$", source_id)
    serial = serial_match.group(1) if serial_match else source_id[-4:]
    return f"{district} 법정 정비구역 · 고시ID {notice_id}/{serial}"


def date_text(value: Any) -> str:
    digits = re.sub(r"[^0-9]", "", clean(value))
    if len(digits) == 8:
        return f"{digits[:4]}-{digits[4:6]}-{digits[6:]}"
    return clean(value)


def load_shapefile(archive: Path, directory: Path) -> gpd.GeoDataFrame:
    if not archive.exists():
        raise SystemExit(f"원본 파일을 찾을 수 없습니다: {archive}")
    if archive.suffix.lower() == ".zip":
        with zipfile.ZipFile(archive) as bundle:
            bundle.extractall(directory)
        shapefiles = sorted(directory.rglob("*.shp"))
    elif archive.suffix.lower() == ".shp":
        shapefiles = [archive]
    else:
        raise SystemExit("입력은 VWorld ZIP 또는 SHP 파일이어야 합니다.")
    if len(shapefiles) != 1:
        names = ", ".join(path.name for path in shapefiles) or "없음"
        raise SystemExit(f"정비구역 SHP 1개가 필요합니다. 발견: {names}")

    last_error: Exception | None = None
    for encoding in ("utf-8", "cp949", "euc-kr"):
        try:
            frame = gpd.read_file(shapefiles[0], encoding=encoding)
            break
        except Exception as error:  # pragma: no cover - driver-dependent
            last_error = error
    else:
        raise SystemExit(f"SHP를 읽지 못했습니다: {last_error}")

    if frame.crs is None:
        raise SystemExit("SHP 좌표계(.prj)가 없습니다. EPSG:5186 원본을 다시 내려받아 주세요.")
    frame = frame[frame.geometry.notna() & ~frame.geometry.is_empty].copy()
    if frame.empty:
        raise SystemExit("유효한 정비구역 도형이 없습니다.")
    return frame


def valid_polygonal(geometry: Any) -> tuple[Any, bool]:
    if geometry.is_valid:
        return geometry, False

    repaired = make_valid(geometry)
    polygon_parts: list[Any] = []

    def collect(candidate: Any) -> None:
        if candidate.geom_type == "Polygon":
            polygon_parts.append(candidate)
        elif candidate.geom_type in {"MultiPolygon", "GeometryCollection"}:
            for part in candidate.geoms:
                collect(part)

    collect(repaired)
    if not polygon_parts:
        raise SystemExit("유효하지 않은 정비구역 도형을 폴리곤으로 복구하지 못했습니다.")
    polygonal = unary_union(polygon_parts)
    if not polygonal.is_valid:
        raise SystemExit("정비구역 도형 복구 후에도 자기교차가 남아 있습니다.")
    return polygonal, True


def build_zones(frame: gpd.GeoDataFrame) -> list[dict[str, Any]]:
    columns = [str(column) for column in frame.columns if column != "geometry"]
    group_column = find_column(columns, GROUP_ID_COLUMNS)
    district_column = find_column(columns, DISTRICT_COLUMNS)
    name_column = find_column(columns, NAME_COLUMNS)
    notice_date_column = find_column(columns, NOTICE_DATE_COLUMNS)

    rows: list[dict[str, Any]] = []
    for index, row in frame.iterrows():
        source_id = clean(row.get(group_column)) if group_column else str(index)
        if not source_id:
            source_id = str(index)
        district_code = clean(row.get(district_column))[:5] if district_column else ""
        source_name = clean(row.get(name_column)) if name_column else ""
        notice_date = date_text(row.get(notice_date_column)) if notice_date_column else ""
        rows.append(
            {
                "source_id": source_id,
                "district_code": district_code,
                "source_name": source_name,
                "notice_date": notice_date,
                "geometry": row.geometry,
            }
        )

    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        key = f"{row['district_code']}:{row['source_id']}"
        grouped.setdefault(key, []).append(row)

    zones: list[dict[str, Any]] = []
    for key, parts in grouped.items():
        geometry, geometry_repaired = valid_polygonal(
            unary_union([part["geometry"] for part in parts])
        )
        zones.append(
            {
                "key": key,
                "source_id": parts[0]["source_id"],
                "district_code": parts[0]["district_code"],
                "source_name": next((part["source_name"] for part in parts if part["source_name"]), ""),
                "notice_date": next((part["notice_date"] for part in parts if part["notice_date"]), ""),
                "part_count": len(parts),
                "geometry": geometry,
                "geometry_repaired": geometry_repaired,
                "area": float(geometry.area),
            }
        )
    return zones


def point_matches(zones: list[dict[str, Any]], projects: list[dict[str, Any]], project_crs: Any) -> dict[int, tuple[int, str, float]]:
    points: list[tuple[int, Point]] = []
    for project_index, project in enumerate(projects):
        center = project.get("center") or {}
        longitude = number(center.get("longitude"))
        latitude = number(center.get("latitude"))
        if longitude and latitude:
            points.append((project_index, Point(longitude, latitude)))
    if not points:
        return {}

    point_frame = gpd.GeoDataFrame(
        {"project_index": [item[0] for item in points]},
        geometry=[item[1] for item in points],
        crs="EPSG:4326",
    ).to_crs(project_crs)
    candidates: list[tuple[float, int, int]] = []
    for point_row in point_frame.itertuples():
        project = projects[point_row.project_index]
        project_area = number(project.get("areaSquareMeters"))
        project_code = district_code_from_project(project)
        for zone_index, zone in enumerate(zones):
            if project_code and zone["district_code"] and project_code != zone["district_code"]:
                continue
            if zone["geometry"].covers(point_row.geometry):
                area_error = (
                    abs(zone["area"] - project_area) / project_area if project_area else 0.0
                )
                # A geocoded address can fall inside a different or enclosing district.
                # When both official areas exist, reject a point whose areas differ by
                # more than 20% instead of attaching a plausible-looking wrong project.
                if project_area and area_error > 0.20:
                    continue
                candidates.append((area_error, zone_index, point_row.project_index))

    matches: dict[int, tuple[int, str, float]] = {}
    used_projects: set[int] = set()
    for error, zone_index, project_index in sorted(candidates):
        if zone_index in matches or project_index in used_projects:
            continue
        matches[zone_index] = (project_index, "point", error)
        used_projects.add(project_index)
    return matches


def area_matches(zones: list[dict[str, Any]], projects: list[dict[str, Any]], matches: dict[int, tuple[int, str, float]]) -> None:
    used_projects = {match[0] for match in matches.values()}
    candidates_by_zone: dict[int, list[tuple[float, int]]] = {}
    for zone_index, zone in enumerate(zones):
        if zone_index in matches:
            continue
        for project_index, project in enumerate(projects):
            if project_index in used_projects:
                continue
            project_area = number(project.get("areaSquareMeters"))
            if not project_area:
                continue
            project_code = district_code_from_project(project)
            if project_code and zone["district_code"] and project_code != zone["district_code"]:
                continue
            error = abs(zone["area"] - project_area) / project_area
            if error <= 0.08:
                candidates_by_zone.setdefault(zone_index, []).append((error, project_index))

    ranked: list[tuple[float, int, int]] = []
    for zone_index, candidates in candidates_by_zone.items():
        candidates.sort()
        best_error, project_index = candidates[0]
        # Reject ambiguous areas: the next candidate must be at least 2 percentage
        # points worse, or twice the relative error of the best candidate.
        if len(candidates) > 1:
            second_error = candidates[1][0]
            if second_error - best_error < 0.02 and second_error < best_error * 2:
                continue
        ranked.append((best_error, zone_index, project_index))

    for error, zone_index, project_index in sorted(ranked):
        if zone_index in matches or project_index in used_projects:
            continue
        matches[zone_index] = (project_index, "area", error)
        used_projects.add(project_index)


def rounded_coordinates(value: Any) -> Any:
    if isinstance(value, (list, tuple)):
        if value and all(isinstance(item, (int, float)) for item in value):
            return [round(float(item), 7) for item in value]
        return [rounded_coordinates(item) for item in value]
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="VWorld UD602 경기 ZIP 또는 SHP")
    parser.add_argument("--projects", type=Path, default=DEFAULT_PROJECTS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--base-date", required=True, help="VWorld 파일 기준월(YYYY-MM)")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="landview-ud602-") as temp_name:
        source_frame = load_shapefile(args.archive, Path(temp_name))
        zones = build_zones(source_frame)
        source_crs = source_frame.crs

        payload = json.loads(args.projects.read_text(encoding="utf-8"))
        projects = payload.get("projects", [])
        if not isinstance(projects, list):
            raise SystemExit("경기 사업현황 JSON 형식이 올바르지 않습니다.")

        matches = point_matches(zones, projects, source_crs)
        area_matches(zones, projects, matches)
        web_frame = gpd.GeoDataFrame(
            {"zone_index": list(range(len(zones)))},
            geometry=[zone["geometry"] for zone in zones],
            crs=source_crs,
        ).to_crs("EPSG:4326")

        features: list[dict[str, Any]] = []
        methods = Counter(match[1] for match in matches.values())
        for web_row in web_frame.itertuples():
            zone_index = int(web_row.zone_index)
            zone = zones[zone_index]
            match = matches.get(zone_index)
            project = projects[match[0]] if match else {}
            project_name = clean(project.get("projectName")) or zone["source_name"]
            if not project_name:
                project_name = fallback_zone_name(
                    zone["district_code"], zone["source_id"]
                )
            district_name = clean(project.get("districtName")) or DISTRICT_NAMES.get(
                zone["district_code"], ""
            )
            project_type = clean(project.get("projectType")) or "법정 정비구역"
            web_mapping = mapping(web_row.geometry)
            rounded_geometry = shape(
                {
                    "type": web_mapping["type"],
                    "coordinates": rounded_coordinates(web_mapping["coordinates"]),
                }
            )
            final_geometry, output_repaired = valid_polygonal(rounded_geometry)
            geometry = mapping(final_geometry)
            min_x, min_y, max_x, max_y = final_geometry.bounds
            source_id = re.sub(r"[^0-9A-Za-z가-힣_-]", "-", zone["source_id"])
            properties = {
                "projectName": project_name or "법정 정비구역",
                "normalizedName": clean(project.get("normalizedName")) or normalize_name(project_name),
                "projectType": project_type,
                "category": category(project_type),
                "programTags": project.get("programTags") or [],
                "stageName": clean(project.get("businessStage")),
                "districtCode": zone["district_code"] or district_code_from_project(project),
                "districtName": district_name,
                "regionName": f"경기도 {district_name}".strip(),
                "areaSquareMeters": round(zone["area"], 1),
                "reportedAreaSquareMeters": number(project.get("areaSquareMeters")),
                "noticeDate": zone["notice_date"],
                "sourceBaseDate": args.base_date,
                "partCount": zone["part_count"],
                "boundaryKind": "legal",
                "matchMethod": match[1] if match else "unmatched",
                "matchAreaErrorRate": round(match[2], 5) if match else None,
                "sourceGeometryId": zone["source_id"],
                "geometryRepaired": zone["geometry_repaired"] or output_repaired,
                "showLabel": True,
                "bounds": [round(min_x, 6), round(min_y, 6), round(max_x, 6), round(max_y, 6)],
            }
            features.append(
                {
                    "type": "Feature",
                    "id": f"gyeonggi-ud602-{zone['district_code']}-{source_id}",
                    "geometry": {
                        "type": geometry["type"],
                        "coordinates": geometry["coordinates"],
                    },
                    "properties": properties,
                }
            )

    output = {
        "type": "FeatureCollection",
        "total": len(features),
        "metadata": {
            "region": "경기",
            "sourceName": SOURCE_NAME,
            "sourceUrl": SOURCE_URL,
            "sourceLicense": SOURCE_LICENSE,
            "sourceBaseDate": args.base_date,
            "boundary": "도시 및 주거환경정비법 제16조 지정·고시 법정 정비구역",
            "generatedBy": "scripts/convert-vworld-maintenance-zones.py",
            "projectSource": payload.get("metadata", {}).get("sources", []),
            "matching": {
                "totalProjects": len(projects),
                "matched": len(matches),
                "point": methods["point"],
                "area": methods["area"],
                "unmatchedZones": len(features) - len(matches),
            },
            "geometryRepairs": sum(
                1 for feature in features if feature["properties"]["geometryRepaired"]
            ),
        },
        "features": features,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(
        f"Wrote {len(features)} legal zones to {args.output} "
        f"(point {methods['point']}, area {methods['area']}, unmatched {len(features) - len(matches)})"
    )


if __name__ == "__main__":
    main()
