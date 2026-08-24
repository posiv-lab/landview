#!/usr/bin/env python3
"""Synthetic regression test for the UD602 conversion and matching rules."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CONVERTER = ROOT / "scripts" / "convert-vworld-maintenance-zones.py"


class ConvertVworldMaintenanceZonesTest(unittest.TestCase):
    def test_point_and_area_matching(self) -> None:
        with tempfile.TemporaryDirectory(prefix="landview-ud602-test-") as temp_name:
            directory = Path(temp_name)
            shapes = gpd.GeoDataFrame(
                {
                    "MNUM": ["A", "B", "C"],
                    "COL_ADM_SE": ["41110", "41110", "41110"],
                    "ALIAS": ["테스트A", "테스트B", "오결합 방지구역"],
                    "NTFDATE": ["20260101", "", "20260203"],
                },
                geometry=[
                    box(200000, 500000, 200100, 500100),
                    box(201000, 500000, 201200, 500100),
                    box(202000, 500000, 202500, 500500),
                ],
                crs="EPSG:5186",
            )
            shape_path = directory / "LSMD_CONT_UD602_경기.shp"
            shapes.to_file(shape_path, encoding="cp949")

            center = gpd.GeoSeries(
                [shapes.geometry.iloc[0].centroid], crs=shapes.crs
            ).to_crs("EPSG:4326").iloc[0]
            rejected_center = gpd.GeoSeries(
                [shapes.geometry.iloc[2].centroid], crs=shapes.crs
            ).to_crs("EPSG:4326").iloc[0]
            projects_path = directory / "projects.json"
            projects_path.write_text(
                json.dumps(
                    {
                        "projects": [
                            {
                                "id": "gyeonggi-41110-a",
                                "projectName": "좌표 결합 재개발",
                                "normalizedName": "좌표결합재개발",
                                "districtName": "수원시",
                                "projectType": "재개발",
                                "businessStage": "사업시행",
                                "areaSquareMeters": 10000,
                                "center": {
                                    "longitude": center.x,
                                    "latitude": center.y,
                                },
                            },
                            {
                                "id": "gyeonggi-41110-b",
                                "projectName": "면적 결합 재건축",
                                "normalizedName": "면적결합재건축",
                                "districtName": "수원시",
                                "projectType": "재건축",
                                "businessStage": "조합설립",
                                "areaSquareMeters": 20000,
                            },
                            {
                                "id": "gyeonggi-41110-c",
                                "projectName": "잘못된 좌표 후보",
                                "normalizedName": "잘못된좌표후보",
                                "districtName": "수원시",
                                "projectType": "재개발",
                                "businessStage": "사업시행",
                                "areaSquareMeters": 10000,
                                "center": {
                                    "longitude": rejected_center.x,
                                    "latitude": rejected_center.y,
                                },
                            },
                        ],
                        "metadata": {"sources": []},
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            output_path = directory / "zones.geojson"

            subprocess.run(
                [
                    sys.executable,
                    str(CONVERTER),
                    str(shape_path),
                    "--projects",
                    str(projects_path),
                    "--base-date",
                    "2026-08",
                    "--output",
                    str(output_path),
                ],
                cwd=ROOT,
                check=True,
            )
            result = json.loads(output_path.read_text(encoding="utf-8"))

            self.assertEqual(result["total"], 3)
            self.assertEqual(result["metadata"]["matching"]["point"], 1)
            self.assertEqual(result["metadata"]["matching"]["area"], 1)
            self.assertEqual(result["metadata"]["matching"]["unmatchedZones"], 1)
            self.assertEqual(
                {feature["properties"]["category"] for feature in result["features"]},
                {"redevelopment", "reconstruction", "legal-zone"},
            )
            unmatched = next(
                feature for feature in result["features"]
                if feature["properties"]["matchMethod"] == "unmatched"
            )
            self.assertEqual(unmatched["properties"]["projectName"], "오결합 방지구역")
            self.assertEqual(unmatched["properties"]["noticeDate"], "2026-02-03")


if __name__ == "__main__":
    unittest.main()
