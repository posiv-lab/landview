import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT_URL = new URL("../", import.meta.url);
const OUTPUT_PATH = fileURLToPath(
  new URL("public/data/gyeonggi-new-town-special-zones.geojson", ROOT_URL)
);
const BUNDANG_PATH = fileURLToPath(
  new URL("public/data/bundang-special-maintenance-zones.geojson", ROOT_URL)
);
const ENV_PATH = fileURLToPath(new URL(".env.local", ROOT_URL));
const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const PARCEL_LAYER_ID = "LP_PA_CBND_BUBUN";

const PAGE_ZONES = [
  {
    id: "pyeongchon-a17",
    pageId: 4384,
    projectName: "평촌 귀인블럭(A-17) 통합재건축",
    programTags: ["노후계획도시", "평촌 선도지구"],
    stageName: "사업시행자 지정",
    districtCode: "41173",
    districtName: "안양시 동안구",
    regionName: "경기도 안양시 동안구",
    reportedAreaSquareMeters: 151161,
    noticeDate: "2025-12-30",
    sourceName: "안양시 고시 제2025-279호",
    sourceUrl:
      "https://anyang.go.kr/main/emwsWebView.do?key=4101&pageIndex=1&pageUnit=1470&regiNo=28295&searchCnd=all&searchGosiSe=01%2C03%2C04&searchKrwd="
  },
  {
    id: "pyeongchon-a18",
    pageId: 4385,
    projectName: "평촌 민백마을(A-18) 통합재건축",
    programTags: ["노후계획도시", "평촌 선도지구"],
    stageName: "사업시행자 지정",
    districtCode: "41173",
    districtName: "안양시 동안구",
    regionName: "경기도 안양시 동안구",
    reportedAreaSquareMeters: 129134,
    noticeDate: "2025-12-30",
    sourceName: "안양시 고시 제2025-279호",
    sourceUrl:
      "https://anyang.go.kr/main/emwsWebView.do?key=4101&pageIndex=1&pageUnit=1470&regiNo=28295&searchCnd=all&searchGosiSe=01%2C03%2C04&searchKrwd="
  },
  {
    id: "sanbon-9-2",
    pageId: 4488,
    projectName: "산본 9-2구역 통합재건축",
    programTags: ["노후계획도시", "산본 선도지구"],
    stageName: "특별정비구역 지정",
    districtCode: "41410",
    districtName: "군포시",
    regionName: "경기도 군포시",
    reportedAreaSquareMeters: 116772,
    noticeDate: "2025-12-23",
    sourceName: "군포시 고시 제2025-167호",
    sourceUrl:
      "https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&notAncmtSeCd=01&not_ancmt_mgt_no=43543"
  }
];

const PARCEL_ZONES = [
  {
    id: "sanbon-11",
    pnus: [
      "4141010400110630000",
      "4141010400110920000",
      "4141010400110520000"
    ],
    projectName: "산본 11구역 통합재건축",
    programTags: ["노후계획도시", "산본 선도지구"],
    stageName: "사업시행자 지정",
    districtCode: "41410",
    districtName: "군포시",
    regionName: "경기도 군포시",
    reportedAreaSquareMeters: 149904,
    noticeDate: "2025-12-23",
    sourceName: "군포시 고시 제2025-168호",
    sourceUrl:
      "https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&notAncmtSeCd=01&not_ancmt_mgt_no=43544"
  },
  {
    id: "jungdong-eunha",
    pnus: [
      "4119210800110360000",
      "4119210800110370000",
      "4119210800110380000",
      "4119210800110390000"
    ],
    projectName: "중동 은하마을 통합재건축",
    programTags: ["노후계획도시", "중동 선도지구"],
    stageName: "사업시행자 지정",
    districtCode: "41192",
    districtName: "부천시 원미구",
    regionName: "경기도 부천시 원미구",
    reportedAreaSquareMeters: null,
    noticeDate: "2026-06-15",
    sourceName: "부천시 고시 제2026-107호",
    sourceUrl: "https://www.eum.go.kr/web/gs/gv/gvGosiDet.jsp?seq=636087"
  }
];

function parseEnv(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/u)
      .map((line) => line.match(/^([^#=]+)=(.*)$/u))
      .filter(Boolean)
      .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/gu, "")])
  );
}

function extractAreas(html, id) {
  const match = html.match(/\\"areas\\":(\[.*?\]),\\"cleanup_cafe_id/su);

  if (!match) {
    throw new Error(`공개 경계 데이터를 읽지 못했습니다: ${id}`);
  }

  return JSON.parse(match[1]);
}

function polygonsOf(geometry) {
  if (geometry?.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates;
  }
  throw new Error("지원하지 않는 필지 경계 형식입니다.");
}

function allPositions(coordinates) {
  return coordinates.flatMap((polygon) => polygon.flatMap((ring) => ring));
}

function calculateBounds(coordinates) {
  const positions = allPositions(coordinates);
  const longitudes = positions.map(([longitude]) => longitude);
  const latitudes = positions.map(([, latitude]) => latitude);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes)
  ].map((value) => Math.round(value * 1_000_000) / 1_000_000);
}

function calculateAreaSquareMeters(coordinates) {
  const earthRadius = 6_378_137;
  let area = 0;

  for (const polygon of coordinates) {
    for (let ringIndex = 0; ringIndex < polygon.length; ringIndex += 1) {
      const ring = polygon[ringIndex];
      const meanLatitude =
        ring.reduce((sum, [, latitude]) => sum + latitude, 0) /
        Math.max(ring.length, 1);
      const latitudeScale = (Math.PI / 180) * earthRadius;
      const longitudeScale =
        latitudeScale * Math.cos((meanLatitude * Math.PI) / 180);
      let twiceArea = 0;

      for (let index = 0; index < ring.length - 1; index += 1) {
        const [longitude1, latitude1] = ring[index];
        const [longitude2, latitude2] = ring[index + 1];
        twiceArea +=
          longitude1 * longitudeScale * (latitude2 * latitudeScale) -
          longitude2 * longitudeScale * (latitude1 * latitudeScale);
      }

      area += (ringIndex === 0 ? 1 : -1) * (Math.abs(twiceArea) / 2);
    }
  }

  return Math.round(area * 10) / 10;
}

function feature(zone, coordinates, boundaryKind, geometryNote) {
  return {
    type: "Feature",
    id: zone.id,
    geometry: { type: "MultiPolygon", coordinates },
    properties: {
      projectName: zone.projectName,
      normalizedName: zone.projectName.replace(/\s/gu, ""),
      projectType: "노후계획도시 특별정비구역",
      category: "new-town-special",
      programTags: zone.programTags,
      stageName: zone.stageName,
      districtCode: zone.districtCode,
      districtName: zone.districtName,
      regionName: zone.regionName,
      areaSquareMeters: calculateAreaSquareMeters(coordinates),
      reportedAreaSquareMeters: zone.reportedAreaSquareMeters,
      noticeDate: zone.noticeDate,
      sourceBaseDate: "2026-08-25",
      partCount: coordinates.length,
      boundaryKind,
      geometryNote,
      showLabel: true,
      bounds: calculateBounds(coordinates),
      sourceName: zone.sourceName,
      sourceUrl: zone.sourceUrl,
      sourceLicense: "공식 고시 원문(기관 이용조건 확인)"
    }
  };
}

async function fetchParcel(apiKey, apiDomain, pnu) {
  const query = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: PARCEL_LAYER_ID,
    key: apiKey,
    domain: apiDomain,
    format: "json",
    crs: "EPSG:4326",
    geometry: "true",
    attribute: "true",
    size: "5",
    attrFilter: `pnu:=:${pnu}`
  });
  const response = await fetch(`${VWORLD_DATA_URL}?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`VWorld 필지 요청 실패: ${pnu} (${response.status})`);
  }

  const payload = await response.json();
  const features = payload?.response?.result?.featureCollection?.features;

  if (payload?.response?.status !== "OK" || !Array.isArray(features) || !features[0]) {
    throw new Error(`VWorld 필지 경계를 찾지 못했습니다: ${pnu}`);
  }

  return features[0].geometry;
}

async function main() {
  const [bundangCollection, envContents] = await Promise.all([
    readFile(BUNDANG_PATH, "utf8").then(JSON.parse),
    readFile(ENV_PATH, "utf8")
  ]);
  const env = parseEnv(envContents);

  if (!env.VWORLD_API_KEY || !env.VWORLD_DOMAIN) {
    throw new Error("VWORLD_API_KEY와 VWORLD_DOMAIN이 필요합니다.");
  }

  const pageFeatures = await Promise.all(
    PAGE_ZONES.map(async (zone) => {
      const response = await fetch(`https://jaegebal.com/develops/${zone.pageId}`);

      if (!response.ok) {
        throw new Error(`공개 경계 요청 실패: ${zone.pageId} (${response.status})`);
      }

      return feature(
        zone,
        extractAreas(await response.text(), zone.pageId),
        "special-legal",
        "공식 고시 지형도면과 대조하여 공개 지도 경계 좌표를 결합한 표시용 재구성 경계"
      );
    })
  );
  const parcelFeatures = await Promise.all(
    PARCEL_ZONES.map(async (zone) => {
      const geometries = await Promise.all(
        zone.pnus.map((pnu) => fetchParcel(env.VWORLD_API_KEY, env.VWORLD_DOMAIN, pnu))
      );
      const coordinates = geometries.flatMap(polygonsOf);

      return feature(
        zone,
        coordinates,
        "representative-parcel",
        "공식 지정 고시의 대표 지번에 속한 공동주택 주필지 경계를 결합한 표시용 경계이며 법정 지형도면과 일부 차이가 날 수 있음"
      );
    })
  );
  const features = [...bundangCollection.features, ...pageFeatures, ...parcelFeatures];
  const collection = {
    type: "FeatureCollection",
    total: features.length,
    metadata: {
      region: "경기도 1기 신도시",
      sourceName: "성남·안양·군포·부천시 노후계획도시 특별정비구역 고시",
      sourceUrl: "https://www.eum.go.kr/",
      sourceLicense: "공식 고시 원문(기관 이용조건 확인)",
      sourceBaseDate: "2026-08-25",
      boundary: "노후계획도시 정비 및 지원에 관한 특별법에 따른 특별정비구역",
      geometryNote:
        "공식 고시와 지형도면을 기준으로 공개 좌표 또는 대표 공동주택 주필지를 결합한 표시용 재구성 자료",
      generatedBy: "scripts/generate-gyeonggi-new-town-special-zones.mjs"
    },
    features
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(collection)}\n`, "utf8");
  console.log(`경기도 특별정비구역 ${features.length}건 생성: ${OUTPUT_PATH}`);
  parcelFeatures.forEach((item) =>
    console.log(`${item.properties.projectName}: ${item.properties.areaSquareMeters}㎡`)
  );
}

await main();
