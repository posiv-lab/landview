#!/usr/bin/env python3
"""Convert the Seoul Plan+ (OA-22712) SHP archive into web-ready GeoJSON.

Covers every 정비사업 programme in the archive — 신속통합기획, 모아타운, 재개발,
재건축, 소규모정비, 재정비촉진, 주거환경개선 — so the map can draw real zone
boundaries instead of bare point labels.

Rows that describe the same zone (same name, type, stage and district) are merged
into one MultiPolygon feature so the map shows a single signpost per zone.

The source archive is kept outside the repository and is never modified.

출처: 서울특별시 서울 열린데이터광장 「서울시 도시계획사업 현황(서울플랜+) 공간정보」(OA-22712)
공공누리 제4유형(출처표시 + 상업적 이용금지 + 변경금지) 자료다. 비상업 운영을 전제로
지도 표시에만 사용하고, 출처와 기준 시점을 화면에 함께 노출한다.

사용법:
    python scripts/convert-seoul-project-zones.py <OA-22712 zip 경로>
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
import zipfile
from pathlib import Path

import geopandas as gpd
from shapely.ops import unary_union

OUTPUT_PATH = Path("public/data/seoul-project-zones.geojson")
SOURCE_NAME = "서울특별시 도시계획사업 현황(서울플랜+) 공간정보 OA-22712"
SOURCE_URL = "https://data.seoul.go.kr/dataList/OA-22712/F/1/datasetView.do"
SOURCE_LICENSE = "공공누리 제4유형(출처표시·상업적이용금지·변경금지)"

# 사업유형 소분류 코드 → (표시 이름, 지도 분류, 프로그램 태그)
# 지도 분류는 폴리곤 색과 범례에 쓰인다.
PROGRAMME_CODES: dict[str, tuple[str, str, str]] = {
    "BZ101": ("신속통합기획", "fast-track", "fast_track_planning"),
    "BZ201": ("모아타운", "moa-town", "moa_town"),
    "BZ102": ("재개발(도시정비형)", "redevelopment", ""),
    "BZ103": ("재개발(주택정비형)", "redevelopment", ""),
    "BZ205": ("소규모재개발", "redevelopment", ""),
    "BZ104": ("재건축(단독)", "reconstruction", ""),
    "BZ105": ("재건축(공동)", "reconstruction", ""),
    "BZ204": ("소규모재건축", "reconstruction", ""),
    "BZ202": ("가로주택정비", "small-scale", ""),
    "BZ203": ("자율주택정비", "small-scale", ""),
    "BZ401": ("재정비촉진지구", "promotion", "renewal_promotion_district"),
    "BZ402": ("재정비촉진구역", "promotion", "renewal_promotion_district"),
    "BZ403": ("존치정비구역", "promotion", "renewal_promotion_district"),
    "BZ404": ("존치관리구역", "promotion", "renewal_promotion_district"),
    "BZ107": ("주거환경개선(관리형)", "residential", ""),
    "BZ108": ("주거환경개선(정비형)", "residential", ""),
}

# 추진단계 코드 → 한글 명칭 (코드정의표 시트 02)
STAGE_CODES = {
    "PP0101": "대상지선정(추진중)",
    "PP0102": "대상지선정",
    "PP0103": "기획완료",
    "PP0104": "보류",
    "PP0201": "입안제안",
    "PP0202": "열람공고",
    "PP0203": "위원회심의",
    "PP0204": "구역지정",
    "PP0205": "추진위구성",
    "PP0206": "조합설립인가",
    "PP0207": "건축심의",
    "PP0208": "사업시행인가",
    "PP0209": "관리처분계획인가",
    "PP0210": "착공",
    "PP0211": "준공",
    "PP0301": "대상지선정",
    "PP0302": "정비계획수립",
    "PP0303": "위원회심의",
    "PP0304": "구역지정",
    "PP0305": "사업시행인가",
    "PP0306": "착공",
    "PP0307": "준공(일부)",
    "PP0308": "준공",
    "PP0401": "수립범위 자문",
    "PP0402": "대상지선정",
    "PP0403": "관리지역고시",
    "PP0404": "사전자문",
    "PP0405": "위원회심의",
    "PP0406": "관리지역고시",
    "PP0500": "조합설립인가 추진중",
    "PP0501": "조합설립인가",
    "PP0502": "건축심의",
    "PP0503": "사업시행인가",
    "PP0504": "착공",
    "PP0505": "준공",
    "PP0601": "주민합의체 구성",
    "PP0602": "건축심의",
    "PP0603": "사업시행인가",
    "PP0604": "착공",
    "PP0605": "준공",
    "PP0701": "조합설립추진중",
    "PP0702": "조합설립인가",
    "PP0703": "건축심의",
    "PP0704": "사업시행계획인가",
    "PP0705": "착공",
    "PP0706": "준공",
    "PP1001": "지구지정",
    "PP1002": "지구변경",
    "PP1101": "대상지선정",
    "PP1102": "촉진계획수립(변경)",
    "PP1103": "열람공고",
    "PP1104": "위원회심의",
    "PP1105": "구역지정",
    "PP1107": "추진위구성",
    "PP1108": "조합설립인가",
    "PP1109": "건축심의",
    "PP1110": "사업시행인가",
    "PP1111": "관리처분계획인가",
    "PP1112": "착공",
    "PP1113": "준공",
    "PP2101": "구역지정",
    "PP2102": "구역변경",
}

SEOUL_DISTRICTS = {
    "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구",
    "11215": "광진구", "11230": "동대문구", "11260": "중랑구", "11290": "성북구",
    "11305": "강북구", "11320": "도봉구", "11350": "노원구", "11380": "은평구",
    "11410": "서대문구", "11440": "마포구", "11470": "양천구", "11500": "강서구",
    "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
    "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구",
    "11740": "강동구",
}

COORDINATE_PRECISION = 6
# 약 2m. 구역 모양은 유지하면서 전체 용량을 절반 가까이 줄인다.
SIMPLIFY_TOLERANCE = 0.00002


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


ZONE_NAME_SUFFIX = re.compile(
    r"(?:주택정비형|도시정비형|소규모|가로주택|주택)?"
    r"(?:재개발|재건축)?"
    r"(?:재정비촉진|정비사업|정비구역|지구단위계획구역|지구단위계획|사업)?"
    r"(?:구역|지구)$"
)


def normalized_name(value: str) -> str:
    """지도에서 같은 구역인지 판별할 비교용 키.

    포인트 자료(OA-22856)나 VWorld 도면명과도 맞물리도록 접미사를 떼어낸다.
    "북아현3 재정비촉진구역 지구단위계획구역"처럼 접미사가 겹친 이름이 있어
    더 이상 줄지 않을 때까지 반복 적용한다.
    """
    text = re.sub(r"\([^)]*\)", "", value or "").replace(" ", "")

    for _ in range(4):
        stripped = ZONE_NAME_SUFFIX.sub("", text)
        if stripped == text:
            break
        text = stripped

    return re.sub(r"[^0-9A-Za-z가-힣]", "", text)


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
                (Path(temp_dir) / Path(decoded).name).write_bytes(archive.read(name))

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
    frame = frame.to_crs("EPSG:4326")
    frame["geometry"] = frame.geometry.simplify(
        SIMPLIFY_TOLERANCE, preserve_topology=True
    )
    frame = frame[frame.geometry.notna() & ~frame.geometry.is_empty]

    base_date = archive_month(archive_path)
    frame["__name"] = frame["DGM_NM"].map(clean_text)
    frame["__district"] = frame["SIGNGU_SE"].map(clean_text)
    frame["__stage"] = frame["PROPEL_CD"].map(clean_text)
    # 같은 구역이 여러 도형으로 쪼개진 행을 하나로 합쳐 이정표 중복을 없앤다.
    grouped = frame.groupby(
        ["__name", "SCLAS_CL", "__stage", "__district"], dropna=False, sort=False
    )

    features: list[dict[str, object]] = []

    for (name, code, stage, district_code), rows in grouped:
        project_type, category, programme_tag = PROGRAMME_CODES[code]
        display_name = name or f"{project_type} 구역"
        geometry = unary_union(list(rows.geometry))

        if geometry.is_empty:
            continue

        minx, miny, maxx, maxy = geometry.bounds
        area_values = [
            float(value)
            for value in rows["DGM_AR"].tolist()
            if value is not None and str(value).strip() not in {"", "nan"}
        ]
        area = sum(area_values) if area_values else None
        notice_dates = [format_date(value) for value in rows["CREATE_DAT"].tolist()]
        district_name = SEOUL_DISTRICTS.get(district_code, "")
        tags = [programme_tag] if programme_tag else []

        if "역세권" in display_name:
            tags.append("station_area")

        features.append(
            {
                "type": "Feature",
                "id": clean_text(rows["PRESENT_SN"].iloc[0]),
                "geometry": round_coordinates(geometry.__geo_interface__),
                "properties": {
                    "projectName": display_name,
                    "normalizedName": normalized_name(display_name),
                    "projectType": project_type,
                    "category": category,
                    "programTags": tags,
                    "stageName": STAGE_CODES.get(stage, ""),
                    "districtCode": district_code,
                    "districtName": district_name,
                    "regionName": f"서울특별시 {district_name}".strip(),
                    "areaSquareMeters": area if area and area > 0 else None,
                    "noticeDate": next((d for d in notice_dates if d), ""),
                    "partCount": len(rows),
                    "bounds": [
                        round(minx, COORDINATE_PRECISION),
                        round(miny, COORDINATE_PRECISION),
                        round(maxx, COORDINATE_PRECISION),
                        round(maxy, COORDINATE_PRECISION),
                    ],
                },
            }
        )

    features.sort(
        key=lambda feature: (
            feature["properties"]["category"],
            feature["properties"]["projectName"],
        )
    )

    return {
        "type": "FeatureCollection",
        "total": len(features),
        "metadata": {
            "region": "서울",
            "sourceName": SOURCE_NAME,
            "sourceUrl": SOURCE_URL,
            "sourceLicense": SOURCE_LICENSE,
            "sourceBaseDate": base_date,
            "generatedBy": "scripts/convert-seoul-project-zones.py",
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
        key = feature["properties"]["category"]
        counts[key] = counts.get(key, 0) + 1

    merged = sum(
        feature["properties"]["partCount"] - 1 for feature in collection["features"]
    )
    size_kb = args.output.stat().st_size / 1024
    print(f"{args.output} 생성 — {collection['total']}구역, {size_kb:,.0f}KB")
    print(f"  (원본 행 {collection['total'] + merged}개를 이름 기준으로 병합)")
    for key, value in sorted(counts.items()):
        print(f"  {key}: {value}구역")


if __name__ == "__main__":
    main()
