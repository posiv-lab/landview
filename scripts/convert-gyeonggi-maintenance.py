#!/usr/bin/env python3
"""Fetch Gyeonggi 일반 정비사업 추진현황 and normalize it for the map.

Source: 경기데이터드림 OpenAPI `GenrlimprvBizpropls`
        https://data.gg.go.kr/portal/data/service/selectServicePage.do?infId=S62GFEEN7JMLMA0PH6CF19108891&infSeq=1
        이용 허락: 상업적 이용 허용, 콘텐츠 변경 불가 (출처표시)

인증키가 없으면 샘플 키로 5건만 내려온다. 전체(500건 이상)를 받으려면
경기데이터드림에서 무료 인증키를 발급받아 GG_API_KEY로 넘긴다.

    python scripts/convert-gyeonggi-maintenance.py --key <경기데이터드림 인증키>

VWORLD_API_KEY가 있으면 대표 좌표까지 함께 채운다(.env.local에서 자동으로 읽는다).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

GG_API_URL = "https://openapi.gg.go.kr/GenrlimprvBizpropls"
VWORLD_SEARCH_URL = "https://api.vworld.kr/req/search"
OUTPUT_PATH = Path("public/data/gyeonggi-maintenance-projects.json")
SOURCE_URL = (
    "https://data.gg.go.kr/portal/data/service/selectServicePage.do"
    "?infId=S62GFEEN7JMLMA0PH6CF19108891&infSeq=1"
)
SOURCE_DATASET = "경기도 일반 정비사업 추진 현황"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

# 사업단계 → 정렬 순서. 서울·인천 변환 스크립트와 같은 축을 쓴다.
STAGE_ORDER = {
    "예정구역": 10,
    "구역지정": 20,
    "추진위원회": 30,
    "조합설립": 40,
    "건축심의": 50,
    "사업시행": 60,
    "사업시행인가": 60,
    "관리처분": 70,
    "착공": 80,
    "준공": 90,
}

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


def normalized_stage(raw: str) -> tuple[str, int]:
    text = clean(raw)
    for label, order in STAGE_ORDER.items():
        if label in text:
            return label, order
    return text or "미분류", 0


def request_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read()

    try:
        return json.loads(payload.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(payload.decode("cp949"))


def fetch_rows(api_key: str) -> list[dict]:
    rows: list[dict] = []
    page = 1
    page_size = 5 if not api_key else 500

    while True:
        params = {"Type": "json", "pIndex": page, "pSize": page_size}
        if api_key:
            params["KEY"] = api_key

        payload = request_json(f"{GG_API_URL}?{urllib.parse.urlencode(params)}")

        if "RESULT" in payload and len(payload) == 1:
            raise SystemExit(
                f"경기데이터드림 응답 오류: {payload['RESULT'].get('MESSAGE')}"
            )

        block_key = next(key for key in payload if key != "RESULT")
        block = payload[block_key]
        total = int(block[0]["head"][0]["list_total_count"])
        page_rows = block[1].get("row") or []
        rows.extend(page_rows)

        if not api_key or len(rows) >= total or not page_rows:
            if not api_key:
                print(
                    f"  인증키 없이 실행 — 전체 {total}건 중 {len(rows)}건만 받았습니다."
                )
            break

        page += 1

    return rows


def convert(rows: list[dict]) -> list[dict]:
    projects: list[dict] = []

    for row in rows:
        name = clean(row.get("IMPRV_ZONE_NM"))
        district = clean(row.get("SIGUN_NM"))
        if not name or not district:
            continue

        stage, stage_order = normalized_stage(row.get("BIZ_STEP_NM"))
        area_text = clean(row.get("ZONE_AR")).replace(",", "")
        try:
            area = float(area_text) if area_text else None
        except ValueError:
            area = None

        projects.append(
            {
                "id": f"gyeonggi-{clean(row.get('SIGUN_CD'))}-{normalized_name(name) or len(projects)}",
                "projectName": name,
                "normalizedName": normalized_name(name),
                "regionCode": "41",
                "districtName": district,
                "location": clean(row.get("LOCPLC_ADDR")),
                "projectType": clean(row.get("BIZ_TYPE_NM")) or "정비사업",
                "programTags": [],
                "legalStatus": "정비구역",
                "businessStage": stage,
                "businessStageOrder": stage_order,
                "rawStage": clean(row.get("BIZ_STEP_NM")),
                "areaSquareMeters": area if area and area > 0 else None,
                "officialUrl": SOURCE_URL,
                "sourceProvider": "경기도",
                "sourceDataset": SOURCE_DATASET,
                "sourceRecordId": clean(row.get("SIGUN_CD")) + "-" + name,
                "sourceBaseDate": "",
                "details": {
                    "existingHouseholds": clean(row.get("EXISTNG_HOUSNG_HSHLD_CNT"))
                    or None,
                    "associationApprovalDate": clean(row.get("ASSOCIATION_ATHRZ_DE")),
                    "constructionStartDate": clean(row.get("CNSTRCT_BGNG_DE")),
                    "note": clean(row.get("RM")),
                },
            }
        )

    return projects


def search_queries(project: dict) -> list[str]:
    location = clean(project.get("location"))
    # 원본에 주소 대신 "nan"이 들어간 행이 있다.
    location = re.sub(r"\bnan\b", " ", location, flags=re.IGNORECASE).strip()
    if not location:
        return []

    # 동·리와 지번이 모두 없으면 시 단위로만 검색돼 엉뚱한 지점이 잡힌다.
    # (예: "경기도 광명시" → 가학동 1) 이런 행은 좌표를 비워 둔다.
    if not re.search(r"[가-힣]+(?:동|리|가)\s*\d", location) and not re.search(
        r"\d+(?:-\d+)?\s*(?:번지|일원|일대)?$", location
    ):
        return []

    if not re.search(r"\d", location):
        return []

    district = clean(project.get("districtName"))
    base = location if location.startswith("경기") else f"경기도 {district} {location}"
    base = re.sub(r"\s+", " ", base).strip()

    simplified = re.sub(r"\([^)]*\)", " ", base)
    # 행정동(철산2동)은 지번 검색이 안 되므로 법정동(철산동)으로 되돌린다.
    simplified = re.sub(r"([가-힣]+?)\d+(가)?동", r"\1\2동", simplified)
    simplified = re.sub(r"([로길])\s+(\d+번길)", r"\1\2", simplified)
    simplified = re.sub(r"\s+", " ", simplified).strip()

    first_lot = re.split(r"[,~]|\s및\s|\s외\s", simplified, maxsplit=1)[0]
    first_lot = re.sub(r"(?:번지)?\s*(?:일원|일대|전지역|지구)$", "", first_lot).strip()
    # 구가 붙어 조회가 안 되는 경우가 있어 구를 뺀 형태도 시도한다.
    without_gu = re.sub(r"\s[가-힣]+구(?=\s)", "", first_lot).strip()

    return list(
        dict.fromkeys(
            q for q in (base, simplified, first_lot, without_gu) if q and len(q) > 6
        )
    )


def unreliable_districts(projects: list[dict]) -> set[str]:
    """주소 칸이 실제 소재지가 아닌 시군을 골라낸다.

    수원시처럼 전 구역이 같은 동 + 연속된 번호("원천동 63, 62, 61 …")로 적혀 있고
    사업명은 팔달·권선·세류 등 다른 지역인 경우가 있다. 그대로 지오코딩하면
    전혀 다른 자리에 이정표가 서므로 좌표를 만들지 않는다.
    """
    flagged: set[str] = set()
    by_district: dict[str, list[dict]] = {}

    for project in projects:
        by_district.setdefault(clean(project.get("districtName")), []).append(project)

    for district, rows in by_district.items():
        if len(rows) <= 8:
            continue

        dongs: list[str] = []
        numbers: list[int] = []
        for project in rows:
            location = clean(project.get("location"))
            dong = re.search(r"([가-힣]+(?:동|리))", location)
            dongs.append(dong.group(1) if dong else "")
            tail = re.search(r"(\d+)\s*(?:번지)?\s*$", location)
            if tail:
                numbers.append(int(tail.group(1)))

        if not dongs or not numbers:
            continue

        top_share = max(dongs.count(value) for value in set(dongs)) / len(rows)
        span = max(numbers) - min(numbers) + 1
        # 한 동에 몰려 있으면서 번호가 거의 빈틈없이 이어지면 일련번호로 본다.
        if top_share > 0.9 and len(numbers) > 8 and span <= len(numbers) * 1.6:
            flagged.add(district)

    return flagged


def geocode(api_key: str, project: dict) -> dict | None:
    for query in search_queries(project):
        params = urllib.parse.urlencode(
            {
                "service": "search",
                "request": "search",
                "version": "2.0",
                "crs": "EPSG:4326",
                "type": "address",
                "category": "parcel",
                "format": "json",
                "size": "5",
                "query": query,
                "key": api_key,
            }
        )

        try:
            payload = request_json(f"{VWORLD_SEARCH_URL}?{params}")
        except Exception:
            time.sleep(0.3)
            continue

        response = payload.get("response") or {}
        if response.get("status") != "OK":
            continue

        # 원본 주소의 동·리 이름. 매칭 결과가 다른 동이면 버린다.
        source_dong = re.search(r"([가-힣]+)(?:\d+(?:가)?)?(동|리)", clean(project.get("location")))
        expected = f"{source_dong.group(1)}{source_dong.group(2)}" if source_dong else ""

        for item in (response.get("result") or {}).get("items") or []:
            parcel = clean((item.get("address") or {}).get("parcel"))
            if "경기도" not in parcel:
                continue

            # VWorld가 지번을 못 찾으면 인접 동으로 대체해 버리는 경우가 있다.
            if expected and expected not in parcel:
                continue

            point = item.get("point") or {}
            try:
                longitude = float(point["x"])
                latitude = float(point["y"])
            except (KeyError, TypeError, ValueError):
                continue

            return {
                "latitude": latitude,
                "longitude": longitude,
                "matchedAddress": parcel,
                "query": query,
                "source": "국토교통부 VWorld 주소검색",
            }

    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--key", default="", help="경기데이터드림 인증키")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--skip-geocode", action="store_true")
    args = parser.parse_args()

    load_env(Path(".env.local"))
    gg_key = args.key or os.environ.get("GG_API_KEY", "").strip()

    print("경기데이터드림에서 정비사업 목록을 받는 중...")
    projects = convert(fetch_rows(gg_key))
    print(f"  {len(projects)}건 정규화 완료")

    vworld_key = os.environ.get("VWORLD_API_KEY", "").strip()
    geocoded = 0

    skipped_districts = unreliable_districts(projects)

    if skipped_districts:
        print(
            "  주소 칸이 실제 소재지가 아니라 좌표를 만들지 않는 시군: "
            + ", ".join(sorted(skipped_districts))
        )

    if not args.skip_geocode and vworld_key:
        print("VWorld 주소검색으로 대표 좌표를 채우는 중...")
        targets = [
            project
            for project in projects
            if clean(project.get("districtName")) not in skipped_districts
        ]
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {
                pool.submit(geocode, vworld_key, project): project
                for project in targets
            }
            for future in as_completed(futures):
                center = future.result()
                if center:
                    futures[future]["center"] = center
                    geocoded += 1
        print(f"  {geocoded}/{len(projects)}건 좌표 확보")
    elif not args.skip_geocode:
        print("VWORLD_API_KEY가 없어 좌표는 건너뜁니다.")

    collection = {
        "type": "LandViewMaintenanceProjectCollection",
        "projects": projects,
        "total": len(projects),
        "metadata": {
            "region": "경기",
            "sources": [{"dataset": SOURCE_DATASET, "url": SOURCE_URL}],
            "generatedBy": "scripts/convert-gyeonggi-maintenance.py",
            "geocoding": {
                "source": "국토교통부 VWorld 주소검색",
                "geocoded": geocoded,
                "unmatched": len(projects) - geocoded,
                "skippedDistricts": sorted(skipped_districts),
            },
        },
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(collection, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_kb = args.output.stat().st_size / 1024
    print(f"{args.output} 생성 — {len(projects)}건, {size_kb:,.0f}KB")


if __name__ == "__main__":
    main()
