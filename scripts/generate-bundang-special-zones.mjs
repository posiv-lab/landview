import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const OUTPUT_PATH = fileURLToPath(
  new URL("../public/data/bundang-special-maintenance-zones.geojson", import.meta.url)
);

const SOURCE_PAGES = {
  sibeomS6: 4359,
  mokryeon6: 4360,
  mokryeonS3: 4361,
  yangji: 4362,
  saetbyeol: 4363,
  sibeom23: 4364
};

const ZONES = [
  {
    id: "bundang-yangji",
    projectName: "분당 양지마을 통합재건축",
    noticeDate: "2026-01-27",
    sourceUrl: "https://www.eum.go.kr/web/gs/gv/gvGosiDet.jsp?seq=628794",
    pageKeys: ["yangji"]
  },
  {
    id: "bundang-saetbyeol-31-s4",
    projectName: "분당 샛별마을 31·S4 결합 재건축",
    noticeDate: "2026-04-30",
    sourceUrl: "https://eum.go.kr/web/gs/gv/gvGosiDet.jsp?seq=634299",
    pageKeys: ["saetbyeol"]
  },
  {
    id: "bundang-mokryeon-6-s3",
    projectName: "분당 목련마을 6·S3 결합 재건축",
    noticeDate: "2026-04-30",
    sourceUrl: "https://www.eum.go.kr/web/gs/gv/gvGosiDet.jsp?seq=634540",
    pageKeys: ["mokryeon6", "mokryeonS3"]
  },
  {
    id: "bundang-sibeom-23-s6",
    projectName: "분당 시범단지 23·S6 결합 재건축",
    noticeDate: "2026-04-30",
    sourceUrl: "https://www.eum.go.kr/web/gs/gv/gvGosiDet.jsp?seq=634037",
    pageKeys: ["sibeom23", "sibeomS6"]
  }
];

function extractPageData(html, id) {
  const areasMatch = html.match(/\\"areas\\":(\[.*?\]),\\"cleanup_cafe_id/s);

  if (!areasMatch) {
    throw new Error(`분당 경계 데이터를 읽지 못했습니다: ${id}`);
  }

  return { areas: JSON.parse(areasMatch[1]) };
}

function flattenPositions(coordinates) {
  return coordinates.flatMap((polygon) => polygon.flatMap((ring) => ring));
}

function calculateBounds(coordinates) {
  const positions = flattenPositions(coordinates);
  const lngs = positions.map(([lng]) => lng);
  const lats = positions.map(([, lat]) => lat);

  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

// 경위도 링을 해당 위도의 평면 좌표로 근사해 표시용 면적을 계산한다.
function calculateAreaSquareMeters(coordinates) {
  const earthRadius = 6_378_137;
  let area = 0;

  for (const polygon of coordinates) {
    for (let ringIndex = 0; ringIndex < polygon.length; ringIndex += 1) {
      const ring = polygon[ringIndex];
      const meanLat =
        ring.reduce((sum, [, lat]) => sum + lat, 0) / Math.max(ring.length, 1);
      const latScale = (Math.PI / 180) * earthRadius;
      const lngScale = latScale * Math.cos((meanLat * Math.PI) / 180);
      let twiceArea = 0;

      for (let index = 0; index < ring.length - 1; index += 1) {
        const [lng1, lat1] = ring[index];
        const [lng2, lat2] = ring[index + 1];
        twiceArea +=
          lng1 * lngScale * (lat2 * latScale) -
          lng2 * lngScale * (lat1 * latScale);
      }

      const ringArea = Math.abs(twiceArea) / 2;
      area += ringIndex === 0 ? ringArea : -ringArea;
    }
  }

  return Math.round(area * 10) / 10;
}

async function main() {
  const pageEntries = await Promise.all(
    Object.entries(SOURCE_PAGES).map(async ([key, id]) => {
      const response = await fetch(`https://jaegebal.com/develops/${id}`);

      if (!response.ok) {
        throw new Error(`분당 공개 경계 요청 실패: ${id} (${response.status})`);
      }

      return [key, extractPageData(await response.text(), id)];
    })
  );
  const pages = Object.fromEntries(pageEntries);
  const features = ZONES.map((zone) => {
    const coordinates = zone.pageKeys.flatMap((key) => pages[key].areas);

    return {
      type: "Feature",
      id: zone.id,
      geometry: { type: "MultiPolygon", coordinates },
      properties: {
        projectName: zone.projectName,
        normalizedName: zone.projectName.replace(/\s/g, ""),
        projectType: "노후계획도시 특별정비구역",
        category: "new-town-special",
        programTags: ["노후계획도시", "분당 선도지구"],
        stageName: "사업시행자 지정",
        districtCode: "41135",
        districtName: "성남시 분당구",
        regionName: "경기도 성남시 분당구",
        areaSquareMeters: calculateAreaSquareMeters(coordinates),
        reportedAreaSquareMeters: null,
        noticeDate: zone.noticeDate,
        sourceBaseDate: "2026-08-24",
        partCount: coordinates.length,
        boundaryKind: "special-legal",
        showLabel: true,
        bounds: calculateBounds(coordinates),
        sourceName: "성남시 분당 노후계획도시 특별정비구역 지형도면 고시",
        sourceUrl: zone.sourceUrl,
        sourceLicense: "공공누리 제1유형(출처표시)"
      }
    };
  });
  const collection = {
    type: "FeatureCollection",
    total: features.length,
    metadata: {
      region: "경기도 성남시 분당구",
      sourceName: "성남시 분당 노후계획도시 특별정비구역 지형도면 고시",
      sourceUrl: "https://www.seongnam.go.kr/pm010301/145352",
      sourceLicense: "공공누리 제1유형(출처표시)",
      sourceBaseDate: "2026-08-24",
      boundary: "노후계획도시 정비 및 지원에 관한 특별법에 따른 특별정비구역",
      geometryNote:
        "공식 고시 지형도면과 대조하여 공개 지도 경계 좌표를 결합한 표시용 재구성 자료",
      generatedBy: "scripts/generate-bundang-special-zones.mjs"
    },
    features
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(collection)}\n`, "utf8");
  console.log(`분당 특별정비구역 ${features.length}건 생성: ${OUTPUT_PATH}`);
}

await main();
