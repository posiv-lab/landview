#!/usr/bin/env python3
"""Build Gyeonggi small-scale housing zones with real parcel boundaries.

Source: 경기데이터드림 OpenAPI `TBGRISSMSCLBSNSM`
        경기도 경기부동산포털 소규모 주택정비사업 정보
        이용 허락: 상업적 이용 허용, 콘텐츠 변경 불가 (출처표시)

이 자료는 다른 경기 자료와 달리 필지고유번호(PNU)를 담고 있다. 주소를 검색해
추정하는 대신 PNU로 국토부 VWorld 연속지적도에서 실제 필지 경계를 가져오므로
위치가 정확하고 구역을 면으로 그릴 수 있다.

PNU는 사업의 대표 1필지를 가리킨다("외 9필지"). 구역 전체 경계가 아니라
대표 필지라는 점을 화면에도 밝혀야 한다.

사용법:
    python scripts/convert-gyeonggi-small-scale-zones.py [--key <경기데이터드림 인증키>]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

GG_API_URL = "https://openapi.gg.go.kr/TBGRISSMSCLBSNSM"
VWORLD_DATA_URL = "https://api.vworld.kr/req/data"
PARCEL_LAYER_ID = "LP_PA_CBND_BUBUN"
OUTPUT_PATH = Path("public/data/gyeonggi-small-scale-zones.geojson")
SOURCE_NAME = "경기도 경기부동산포털 소규모 주택정비사업 정보"
SOURCE_URL = (
    "https://data.gg.go.kr/portal/data/service/selectServicePage.do"
    "?infId=13H5REOHIUBGL1CYYHSG35587037&infSeq=2"
)
SOURCE_LICENSE = "출처표시 + 상업적 이용 허용 + 변경 금지"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)
COORDINATE_PRECISION = 6

# 사업명에서 읽어낼 소규모정비 갈래
PROJECT_TYPE_PATTERNS: list[tuple[str, str]] = [
    (r"가로주택", "가로주택정비"),
    (r"자율주택", "자율주택정비"),
    (r"소규모재건축", "소규모재건축"),
    (r"소규모재개발", "소규모재개발"),
    (r"주거환경관리", "주거환경관리"),
    (r"소규모주택정비관리지역|관리지역", "소규모주택정비 관리지역"),
]

ZONE_NAME_SUFFIX = re.compile(
    r"(?:주택정비형|도시정비형|소규모|가로주택|주택)?"
    r"(?:재개발|재건축)?"
    r"(?:재정비촉진|정비사업|정비구역|지구단위계획구역|지구단위계획|사업)?"
    r"(?:구역|지구)$"
)


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def clean(value: object) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "null"} else text


def normalized_name(value: str) -> str:
    text = re.sub(r"\([^)]*\)", "", value or "").replace(" ", "")
    for _ in range(4):
        stripped = ZONE_NAME_SUFFIX.sub("", text)
        if stripped == text:
            break
        text = stripped
    return re.sub(r"[^0-9A-Za-z가-힣]", "", text)


def request_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read()
    try:
        return json.loads(payload.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(payload.decode("cp949"))


def fetch_rows(api_key: str) -> list[dict]:
    params = {"Type": "json", "pIndex": 1, "pSize": 500 if api_key else 5}
    if api_key:
        params["KEY"] = api_key

    payload = request_json(f"{GG_API_URL}?{urllib.parse.urlencode(params)}")

    if "RESULT" in payload and len(payload) == 1:
        raise SystemExit(f"경기데이터드림 응답 오류: {payload['RESULT'].get('MESSAGE')}")

    block = payload[next(key for key in payload if key != "RESULT")]
    total = int(block[0]["head"][0]["list_total_count"])
    rows = block[1].get("row") or []

    if not api_key:
        print(f"  인증키 없이 실행 — 전체 {total}건 중 {len(rows)}건만 받았습니다.")

    return rows


def project_type(name: str) -> str:
    for pattern, label in PROJECT_TYPE_PATTERNS:
        if re.search(pattern, name):
            return label
    return "소규모주택정비"


def round_coordinates(value: object) -> object:
    if isinstance(value, (int, float)):
        return round(float(value), COORDINATE_PRECISION)
    if isinstance(value, (list, tuple)):
        return [round_coordinates(item) for item in value]
    return value


def fetch_parcel(api_key: str, api_domain: str, pnu: str) -> dict | None:
    params = urllib.parse.urlencode(
        {
            "service": "data",
            "request": "GetFeature",
            "data": PARCEL_LAYER_ID,
            "key": api_key,
            "domain": api_domain,
            "format": "json",
            "crs": "EPSG:4326",
            "geometry": "true",
            "attribute": "true",
            "size": "5",
            "attrFilter": f"pnu:=:{pnu}",
        }
    )

    try:
        payload = request_json(f"{VWORLD_DATA_URL}?{params}")
    except Exception:
        return None

    response = payload.get("response") or {}
    if response.get("status") != "OK":
        return None

    features = (
        (response.get("result") or {}).get("featureCollection", {}).get("features") or []
    )
    return features[0] if features else None


def bounds_of(geometry: dict) -> list[float]:
    coordinates = geometry["coordinates"]
    polygons = [coordinates] if geometry["type"] == "Polygon" else coordinates
    xs: list[float] = []
    ys: list[float] = []
    for polygon in polygons:
        for ring in polygon:
            for point in ring:
                xs.append(point[0])
                ys.append(point[1])
    return [
        round(min(xs), COORDINATE_PRECISION),
        round(min(ys), COORDINATE_PRECISION),
        round(max(xs), COORDINATE_PRECISION),
        round(max(ys), COORDINATE_PRECISION),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key", default="")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    load_env(Path(".env.local"))
    gg_key = args.key or os.environ.get("GG_API_KEY", "").strip()
    vworld_key = os.environ.get("VWORLD_API_KEY", "").strip()
    vworld_domain = os.environ.get("VWORLD_DOMAIN", "").strip()

    if not vworld_key or not vworld_domain:
        raise SystemExit("VWORLD_API_KEY와 VWORLD_DOMAIN이 필요합니다.")

    print("경기데이터드림에서 소규모 주택정비사업 목록을 받는 중...")
    rows = fetch_rows(gg_key)
    print(f"  {len(rows)}건 수신")

    print("PNU로 연속지적도에서 대표 필지 경계를 가져오는 중...")
    features: list[dict] = []
    matched = 0

    def build(row: dict) -> dict | None:
        pnu = clean(row.get("LAND_IDNTFY_NO"))
        name = clean(row.get("BIZ_NM"))
        if not pnu or not name:
            return None

        parcel = fetch_parcel(vworld_key, vworld_domain, pnu)
        if not parcel or not parcel.get("geometry"):
            return None

        district = clean(row.get("SIGNGU_NM"))
        area_text = clean(row.get("BIZ_IMPLMTN_AR")).replace(",", "")
        try:
            area = float(area_text) if area_text else None
        except ValueError:
            area = None

        return {
            "type": "Feature",
            "id": f"gyeonggi-small-{pnu}",
            "geometry": round_coordinates(parcel["geometry"]),
            "properties": {
                "projectName": name,
                "normalizedName": normalized_name(name),
                "projectType": project_type(name),
                "category": "small-scale",
                "programTags": [],
                # 원본은 추진단계가 아니라 관리계획 승인 여부(O/X)만 담고 있다.
                "stageName": (
                    "관리계획 승인"
                    if clean(row.get("MANAGE_PLAN_APRV_STATE")).upper().startswith("O")
                    else ""
                ),
                "districtCode": pnu[:5],
                "districtName": district,
                "regionName": f"경기도 {district}".strip(),
                "areaSquareMeters": area if area and area > 0 else None,
                "noticeDate": "",
                "sourceBaseDate": "",
                "partCount": 1,
                "pnu": pnu,
                "parcelAddress": clean((parcel.get("properties") or {}).get("addr")),
                "representativeParcelOnly": True,
                "bounds": bounds_of(parcel["geometry"]),
            },
        }

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(build, row) for row in rows]
        for future in as_completed(futures):
            feature = future.result()
            if feature:
                features.append(feature)
                matched += 1

    print(f"  {matched}/{len(rows)}건 필지 경계 확보")

    features.sort(key=lambda feature: feature["properties"]["projectName"])

    collection = {
        "type": "FeatureCollection",
        "total": len(features),
        "metadata": {
            "region": "경기",
            "sourceName": SOURCE_NAME,
            "sourceUrl": SOURCE_URL,
            "sourceLicense": SOURCE_LICENSE,
            "sourceBaseDate": "",
            "boundary": "PNU 기준 대표 1필지 (구역 전체 경계 아님)",
            "generatedBy": "scripts/convert-gyeonggi-small-scale-zones.py",
        },
        "features": features,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(collection, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{args.output} 생성 — {len(features)}구역, {args.output.stat().st_size / 1024:,.0f}KB")


if __name__ == "__main__":
    main()
