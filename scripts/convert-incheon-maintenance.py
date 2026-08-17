#!/usr/bin/env python3
"""Normalize Incheon official maintenance-project CSV files for LandView."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import unicodedata
from pathlib import Path


GENERAL_SOURCE_URL = "https://www.data.go.kr/data/15055212/fileData.do"
SMALL_SOURCE_URL = "https://www.data.go.kr/data/15072776/fileData.do"


def clean(value: object) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).strip()


def number(value: object) -> float | None:
    normalized = re.sub(r"[^0-9.]", "", clean(value))
    if not normalized:
        return None
    parsed = float(normalized)
    return parsed if parsed >= 0 else None


def integer(value: object) -> int | None:
    parsed = number(value)
    return round(parsed) if parsed is not None else None


def date(value: object) -> str:
    normalized = re.sub(r"[^0-9]", "", clean(value))
    if len(normalized) != 8:
        return ""
    return f"{normalized[:4]}-{normalized[4:6]}-{normalized[6:]}"


def normalized_name(value: str) -> str:
    normalized = clean(value).lower()
    normalized = re.sub(r"\([^)]*\)", "", normalized)
    normalized = re.sub(
        r"(?:주택정비형|도시정비형|소규모|가로주택|주택)?(?:재개발|재건축)?(?:정비사업)?(?:지구단위계획)?(?:사업)?(?:구역|지구)$",
        "",
        normalized,
    )
    return re.sub(r"[^0-9a-z가-힣]", "", normalized)


def normalized_stage(value: str) -> tuple[str, int]:
    stage = clean(value)
    rules = [
        ("해제", "해제", 100),
        ("준공", "준공", 90),
        ("착공", "착공", 80),
        ("관리처분", "관리처분", 70),
        ("사업시행계획인가", "사업시행인가", 60),
        ("사업시행자지정", "사업시행자 지정", 55),
        ("건축심의", "건축심의", 50),
        ("조합설립", "조합설립", 40),
        ("주민합의체", "주민합의체", 35),
        ("추진위원회", "추진위원회", 30),
        ("추진위", "추진위원회", 30),
        ("정비구역지정", "구역지정", 20),
        ("후보지", "후보지", 10),
        ("공람", "입안·공람", 15),
    ]
    for keyword, label, order in rules:
        if keyword in stage:
            return label, order
    return stage or "기타", 0


def stable_id(dataset: str, district: str, name: str, location: str) -> str:
    source = "|".join((dataset, district, name, location)).encode("utf-8")
    return "incheon-" + hashlib.sha256(source).hexdigest()[:20]


def read_csv(path: Path) -> list[dict[str, str]]:
    text = path.read_bytes().decode("cp949")
    reader = csv.DictReader(text.splitlines())
    return [
        {clean(key): clean(value) for key, value in row.items() if key is not None}
        for row in reader
    ]


def general_projects(path: Path, base_date: str) -> list[dict[str, object]]:
    dataset = "인천광역시 도시 및 주거환경 정비사업 추진현황"
    projects = []
    for row in read_csv(path):
        district = row.get("구명", "")
        name = row.get("구 역 명", "")
        location = row.get("위치", "")
        raw_stage = row.get("진행단계", "")
        stage, stage_order = normalized_stage(raw_stage)
        projects.append(
            {
                "id": stable_id(dataset, district, name, location),
                "projectName": name,
                "normalizedName": normalized_name(name),
                "regionCode": "28",
                "districtName": district,
                "location": location,
                "projectType": row.get("사업유형", "정비사업"),
                "legalStatus": "",
                "businessStage": stage,
                "businessStageOrder": stage_order,
                "rawStage": raw_stage,
                "areaSquareMeters": number(row.get("면적(제곱미터)", "")),
                "officialUrl": GENERAL_SOURCE_URL,
                "sourceProvider": "인천광역시",
                "sourceDataset": dataset,
                "sourceRecordId": stable_id(dataset, district, name, location),
                "sourceBaseDate": base_date,
                "details": {},
            }
        )
    return projects


def small_projects(path: Path, base_date: str) -> list[dict[str, object]]:
    dataset = "인천광역시 소규모주택정비추진현황"
    projects = []
    for row in read_csv(path):
        district = row.get("구청", "")
        name = row.get("구역명", "")
        location = row.get("위치", "")
        raw_stage = row.get("추진단계", "")
        stage, stage_order = normalized_stage(raw_stage)
        projects.append(
            {
                "id": stable_id(dataset, district, name, location),
                "projectName": name,
                "normalizedName": normalized_name(name),
                "regionCode": "28",
                "districtName": district,
                "location": location,
                "projectType": row.get("사업유형", "소규모주택정비"),
                "legalStatus": "",
                "businessStage": stage,
                "businessStageOrder": stage_order,
                "rawStage": raw_stage,
                "areaSquareMeters": number(row.get("면적", "")),
                "officialUrl": SMALL_SOURCE_URL,
                "sourceProvider": "인천광역시",
                "sourceDataset": dataset,
                "sourceRecordId": stable_id(dataset, district, name, location),
                "sourceBaseDate": base_date,
                "details": {
                    "memberCount": integer(row.get("조합원수", "")),
                    "ownerCount": integer(row.get("토지등 소유자수", "")),
                    "residentAgreementDate": date(row.get("주민합의체(조합설립)", "")),
                    "architecturalReviewDate": date(row.get("건축심의", "")),
                    "implementationApprovalDate": date(
                        row.get("사업시행계획인가", "")
                    ),
                    "managementDispositionDate": date(
                        row.get("관리처분계획인가", "")
                    ),
                    "constructionStartDate": date(row.get("착공(시공중)", "")),
                    "note": row.get("비고", ""),
                },
            }
        )
    return projects


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--general", required=True, type=Path)
    parser.add_argument("--small", required=True, type=Path)
    parser.add_argument("--general-base-date", required=True)
    parser.add_argument("--small-base-date", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    projects = general_projects(args.general, args.general_base_date)
    projects.extend(small_projects(args.small, args.small_base_date))
    projects.sort(
        key=lambda project: (
            project["districtName"],
            project["projectName"],
            project["sourceDataset"],
        )
    )

    payload = {
        "type": "LandViewMaintenanceProjectCollection",
        "projects": projects,
        "total": len(projects),
        "metadata": {
            "region": "인천",
            "sources": [
                {
                    "dataset": "인천광역시 도시 및 주거환경 정비사업 추진현황",
                    "baseDate": args.general_base_date,
                    "url": GENERAL_SOURCE_URL,
                },
                {
                    "dataset": "인천광역시 소규모주택정비추진현황",
                    "baseDate": args.small_base_date,
                    "url": SMALL_SOURCE_URL,
                },
            ],
            "generatedBy": "scripts/convert-incheon-maintenance.py",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"{len(projects)}개 인천 정비사업 생성: {args.output}")


if __name__ == "__main__":
    main()
