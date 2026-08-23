#!/usr/bin/env python3
"""Convert the Seoul Plan+ (OA-22712) SHP archive into web-ready GeoJSON.

Extracts only the two policy programmes that no other open dataset covers:
신속통합기획(BZ101) and 모아타운(BZ201).

The source archive is kept outside the repository and is never modified.

출처: 서울특별시 서울 열린데이터광장 「서울시 도시계획사업 현황(서울플랜+) 공간정보」(OA-22712)
공공누리 제4유형(출처표시 + 상업적 이용금지 + 변경금지) 자료다. 비상업 운영을 전제로
지도 표시에만 사용하고, 출처와 기준 시점을 화면에 함께 노출한다.

사용법:
    python scripts/convert-seoul-policy-zones.py <OA-22712 zip 경로>
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
import zipfile
from pathlib import Path

import geopandas as gpd

OUTPUT_PATH = Path("public/data/seoul-policy-zones.geojson")
SOURCE_NAME = "서울특별시 도시계획사업 현황(서울플랜+) 공간정보 OA-22712"
SOURCE_URL = "https://data.seoul.go.kr/dataList/OA-22712/F/1/datasetView.do"
SOURCE_LICENSE = "공공누리 제4유형(출처표시·상업적이용금지·변경금지)"

# 사업유형 소분류 코드 → 표시 이름과 프로그램 태그
PROGRAMME_CODES = {
    "BZ101": ("신속통합기획", "fast_track_planning"),
    "BZ201": ("모아타운", "moa_town"),
}

# 추진단계 코드 → 한글 명칭 (코드정의표 시트 02 기준, 위 두 사업 관련분만)
STAGE_CODES = {
    "PP0101": "대상지선정(추진중)",
    "PP0102": "대상지선정",
    "PP0103": "기획완료",
    "PP0104": "보류",
    "PP0401": "수립범위 자문",
    "PP0402": "대상지선정",
    "PP0403": "관리지역고시",
    "PP0404": "사전자문",
    "PP0405": "위원회심의",
    "PP0406": "관리지역고시",
}

SEOUL_DISTRICTS = {
    "11110": "종로구",
    "11140": "중구",
    "11170": "용산구",
    "11200": "성동구",
    "11215": "광진구",
    "11230": "동대문구",
    "11260": "중랑구",
    "11290": "성북구",
    "11305": "강북구",
    "11320": "도봉구",
    "11350": "노원구",
    "11380": "은평구",
    "11410": "서대문구",
    "11440": "마포구",
    "11470": "양천구",
    "11500": "강서구",
    "11530": "구로구",
    "11545": "금천구",
    "11560": "영등포구",
    "11590": "동작구",
    "11620": "관악구",
    "11650": "서초구",
    "11680": "강남구",
    "11710": "송파구",
    "11740": "강동구",
}

# 좌표 소수점 자리수. 약 1cm 해상도로 파일 크기를 줄인다.
COORDINATE_PRECISION = 6
# 단순화 허용 오차(도 단위, 약 1m). 구역 경계 모양은 유지하면서 정점 수를 줄인다.
SIMPLIFY_TOLERANCE = 0.00001


def clean_text(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none"} else text


def format_date(value: object) -> str:
    digits = re.sub(r"[^0-9]", "", clean_text(value))
    if len(digits) != 8:
        return ""
    return f"{digits[:4]}-{digits[4:6]}-{digits[6:]}"


def archive_month(path: Path) -> str:
    candidates = [path.stem]
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            try:
                candidates.append(name.encode("cp437").decode("cp949"))
            except (UnicodeDecodeError, UnicodeEncodeError):
                candidates.append(name)
    match = re.search(r"_(20\d{4})(?:\D|$)", " ".join(candidates))
    if not match:
        return ""
    value = match.group(1)
    return f"{value[:4]}-{value[4:]}"


def read_archive(path: Path) -> gpd.GeoDataFrame:
    with tempfile.TemporaryDirectory(prefix="landview-uq120-") as temp_dir:
        with zipfile.ZipFile(path) as archive:
            for name in archive.namelist():
                if name.endswith("/"):
                    continue
                try:
                    decoded = name.encode("cp437").decode("cp949")
                except (UnicodeDecodeError, UnicodeEncodeError):
                    decoded = name
                target = Path(temp_dir) / Path(decoded).name
                target.write_bytes(archive.read(name))

        shapefiles = list(Path(temp_dir).rglob("*.shp"))
        if len(shapefiles) != 1:
            raise ValueError(f"{path.name}: SHP 파일은 정확히 1개여야 합니다.")
        return gpd.read_file(shapefiles[0], encoding="cp949")


def round_coordinates(value: object) -> object:
    if isinstance(value, (int, float)):
        return round(float(value), COORDINATE_PRECISION)
    if isinstance(value, (list, tuple)):
        return [round_coordinates(item) for item in value]
    return value


def convert(archive_path: Path) -> dict[str, object]:
    frame = read_archive(archive_path)
    frame = frame[frame["SCLAS_CL"].isin(PROGRAMME_CODES)].copy()
    frame = frame[frame.geometry.notna() & ~frame.geometry.is_empty]

    # 서울시 SHP은 EPSG:5174(중부원점 Bessel). 웹 표준 WGS84로 변환한다.
    frame = frame.to_crs("EPSG:4326")
    frame["geometry"] = frame.geometry.simplify(
        SIMPLIFY_TOLERANCE, preserve_topology=True
    )
    frame = frame[frame.geometry.notna() & ~frame.geometry.is_empty]

    base_date = archive_month(archive_path)
    features: list[dict[str, object]] = []

    for _, row in frame.iterrows():
        code = clean_text(row["SCLAS_CL"])
        project_type, programme_tag = PROGRAMME_CODES[code]
        district_code = clean_text(row["SIGNGU_SE"])
        name = clean_text(row["DGM_NM"]) or f"{project_type} 구역"
        minx, miny, maxx, maxy = row.geometry.bounds
        area = row["DGM_AR"]

        features.append(
            {
                "type": "Feature",
                "id": clean_text(row["PRESENT_SN"]),
                "geometry": round_coordinates(row.geometry.__geo_interface__),
                "properties": {
                    "projectName": name,
                    "projectType": project_type,
                    "programTags": [programme_tag],
                    "stageName": STAGE_CODES.get(clean_text(row["PROPEL_CD"]), ""),
                    "districtCode": district_code,
                    "districtName": SEOUL_DISTRICTS.get(district_code, ""),
                    "regionName": f"서울특별시 {SEOUL_DISTRICTS.get(district_code, '')}".strip(),
                    "areaSquareMeters": (
                        float(area) if area is not None and float(area) > 0 else None
                    ),
                    "noticeDate": format_date(row["CREATE_DAT"]),
                    "bounds": [
                        round(minx, COORDINATE_PRECISION),
                        round(miny, COORDINATE_PRECISION),
                        round(maxx, COORDINATE_PRECISION),
                        round(maxy, COORDINATE_PRECISION),
                    ],
                    "sourceName": SOURCE_NAME,
                    "sourceUrl": SOURCE_URL,
                    "sourceLicense": SOURCE_LICENSE,
                    "sourceBaseDate": base_date,
                },
            }
        )

    features.sort(key=lambda feature: (
        feature["properties"]["projectType"],
        feature["properties"]["projectName"],
    ))

    return {
        "type": "FeatureCollection",
        "total": len(features),
        "metadata": {
            "region": "서울",
            "programmes": sorted({value[0] for value in PROGRAMME_CODES.values()}),
            "sourceName": SOURCE_NAME,
            "sourceUrl": SOURCE_URL,
            "sourceLicense": SOURCE_LICENSE,
            "sourceBaseDate": base_date,
            "generatedBy": "scripts/convert-seoul-policy-zones.py",
        },
        "features": features,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="OA-22712 SHP zip 경로")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    collection = convert(args.archive)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(collection, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    counts: dict[str, int] = {}
    for feature in collection["features"]:
        key = feature["properties"]["projectType"]
        counts[key] = counts.get(key, 0) + 1

    size_kb = args.output.stat().st_size / 1024
    print(f"{args.output} 생성 — {collection['total']}건, {size_kb:,.0f}KB")
    for key, value in sorted(counts.items()):
        print(f"  {key}: {value}건")


if __name__ == "__main__":
    main()
