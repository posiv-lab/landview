#!/usr/bin/env python3
"""Convert Seoul OA-22856 maintenance statistics XLSX to LandView JSON."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree


SOURCE_URL = "https://data.seoul.go.kr/dataList/OA-22856/S/1/datasetView.do"
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def clean(value: object) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).strip()


def integer(value: object) -> int | None:
    normalized = re.sub(r"[^0-9.-]", "", clean(value))
    if not normalized:
        return None
    try:
        return round(float(normalized))
    except ValueError:
        return None


def excel_date(value: object) -> str:
    serial = integer(value)
    if serial is None or serial <= 0:
        return ""
    return (datetime(1899, 12, 30) + timedelta(days=serial)).date().isoformat()


def normalized_name(value: str) -> str:
    normalized = clean(value).lower()
    normalized = re.sub(r"\([^)]*\)", "", normalized)
    normalized = re.sub(
        r"(?:주택정비형|도시정비형|아파트지구|단독주택)?(?:재개발|재건축)?(?:정비사업)?(?:사업)?(?:구역|지구)$",
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
        ("이주", "이주", 75),
        ("관리처분", "관리처분", 70),
        ("사업시행", "사업시행인가", 60),
        ("건축심의", "건축심의", 50),
        ("조합설립", "조합설립", 40),
        ("추진위원회", "추진위원회", 30),
        ("추진위", "추진위원회", 30),
        ("구역지정", "구역지정", 20),
    ]
    for keyword, label, order in rules:
        if keyword in stage:
            return label, order
    return stage or "기타", 0


def cell_column(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference)
    if not letters:
        return 0
    result = 0
    for character in letters.group(0):
        result = result * 26 + ord(character) - ord("A") + 1
    return result - 1


def workbook_rows(path: Path) -> list[list[str]]:
    namespace = {"m": MAIN_NS, "r": REL_NS, "pr": PACKAGE_REL_NS}
    with zipfile.ZipFile(path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", namespace):
                shared_strings.append(
                    "".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t"))
                )

        workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        relationships = ElementTree.fromstring(
            archive.read("xl/_rels/workbook.xml.rels")
        )
        targets = {
            item.attrib["Id"]: item.attrib["Target"] for item in relationships
        }
        sheet = workbook.find("m:sheets", namespace)[0]
        target = targets[sheet.attrib[f"{{{REL_NS}}}id"]]
        sheet_path = "xl/" + target.lstrip("/")
        root = ElementTree.fromstring(archive.read(sheet_path))

        rows: list[list[str]] = []
        for row in root.findall(".//m:sheetData/m:row", namespace):
            values = [""] * 26
            for cell in row.findall("m:c", namespace):
                column = cell_column(cell.attrib.get("r", ""))
                if not 0 <= column < len(values):
                    continue
                value_node = cell.find("m:v", namespace)
                if value_node is None:
                    continue
                value = value_node.text or ""
                if cell.attrib.get("t") == "s" and value:
                    value = shared_strings[int(value)]
                values[column] = clean(value)
            rows.append(values)
        return rows


def convert(path: Path, base_date: str) -> list[dict[str, object]]:
    rows = workbook_rows(path)
    projects: list[dict[str, object]] = []

    for row in rows[5:]:
        code, district, name = clean(row[0]), clean(row[2]), clean(row[3])
        if not code or not district or not name:
            continue
        stage, stage_order = normalized_stage(row[9])
        public_private, district_type = clean(row[6]), clean(row[7])
        program_tags = []
        if public_private == "공공":
            program_tags.append("public_led")
        if "재촉" in district_type:
            program_tags.append("renewal_promotion_district")

        project = {
            "id": f"seoul-{code}",
            "projectName": name,
            "normalizedName": normalized_name(name),
            "regionCode": "11",
            "districtName": district,
            "location": clean(row[4]) or clean(row[5]),
            "roadAddress": "" if clean(row[5]) == "-" else clean(row[5]),
            "projectType": clean(row[8]) or "정비사업",
            "programTags": program_tags,
            "legalStatus": "정비구역",
            "businessStage": stage,
            "businessStageOrder": stage_order,
            "rawStage": clean(row[9]),
            "areaSquareMeters": None,
            "officialUrl": SOURCE_URL,
            "sourceProvider": "서울특별시",
            "sourceDataset": "서울특별시 도시정비사업 통계 OA-22856",
            "sourceRecordId": code,
            "sourceBaseDate": base_date,
            "details": {
                "publicPrivate": public_private,
                "districtType": district_type,
                "existingHouseholds": integer(row[10]),
                "districtDesignationDate": excel_date(row[12] or row[11]),
                "committeeApprovalDate": excel_date(row[13]),
                "associationApprovalDate": excel_date(row[14]),
                "architecturalReviewDate": excel_date(row[15]),
                "implementationApprovalDate": excel_date(row[17] or row[16]),
                "managementDispositionDate": excel_date(row[19] or row[18]),
                "relocationStartDate": excel_date(row[20]),
                "relocationEndDate": excel_date(row[21]),
                "constructionStartDate": excel_date(row[22]),
                "plannedHouseholds": integer(row[23]),
                "plannedSaleHouseholds": integer(row[24]),
                "plannedRentalHouseholds": integer(row[25]),
            },
        }
        projects.append(project)

    return projects


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--base-date", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    projects = convert(args.input, args.base_date)
    payload = {
        "type": "LandViewMaintenanceProjectCollection",
        "projects": projects,
        "total": len(projects),
        "metadata": {
            "region": "서울",
            "sources": [
                {
                    "dataset": "서울특별시 도시정비사업 통계 OA-22856",
                    "baseDate": args.base_date,
                    "url": SOURCE_URL,
                }
            ],
            "generatedBy": "scripts/convert-seoul-maintenance.py",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"서울 정비사업 {len(projects)}건 생성: {args.output}")


if __name__ == "__main__":
    main()
