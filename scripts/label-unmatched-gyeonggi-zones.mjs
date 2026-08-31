import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// 사업 현황과 일대일로 묶이지 않은 법정 정비구역에 라벨을 붙인다.
//
// 고시 식별자는 사람이 알아볼 수 없으므로, 구역 중심의 실제 지번을 연속지적도에서
// 역조회해 "시 · 동 지번 일원" 형태로 표시한다. 같은 지번이 사업 현황의 소재지와
// 정확히 맞아떨어질 때만 공식 사업명을 붙이고, 그 외에는 사업명을 추측하지 않는다.
//
// 사용법: node scripts/label-unmatched-gyeonggi-zones.mjs

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DATA_PATH = fileURLToPath(
  new URL("../public/data/gyeonggi-legal-maintenance-zones.geojson", import.meta.url)
);
const PROJECT_PATH = fileURLToPath(
  new URL("../public/data/gyeonggi-maintenance-projects.json", import.meta.url)
);
const CACHE_PATH = fileURLToPath(new URL("../downloads/zone-parcel-cache.json", import.meta.url));
const VWORLD_URL = "https://api.vworld.kr/req/data";
const PARCEL_LAYER = "LP_PA_CBND_BUBUN";

const DISTRICT_NAMES = {
  "41110": "수원시", "41130": "성남시", "41150": "의정부시", "41170": "안양시",
  "41190": "부천시", "41210": "광명시", "41220": "평택시", "41250": "동두천시",
  "41270": "안산시", "41280": "고양시", "41290": "과천시", "41310": "구리시",
  "41360": "남양주시", "41370": "오산시", "41390": "시흥시", "41410": "군포시",
  "41430": "의왕시", "41450": "하남시", "41460": "용인시", "41480": "파주시",
  "41500": "이천시", "41550": "안성시", "41570": "김포시", "41590": "화성시",
  "41610": "광주시", "41630": "양주시", "41650": "포천시", "41670": "여주시",
  "41800": "연천군", "41820": "가평군", "41830": "양평군"
};

// 완료된 사업은 지도에서 제외하므로 이름 후보에서도 뺀다.
const FINISHED_STAGES = /준공|입주|청산|해산|이전고시/u;

function loadEnv() {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/gu, "");
  }
  return env;
}

function centroidOf(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let x = 0;
  let y = 0;
  let count = 0;
  for (const polygon of polygons) {
    for (const point of polygon[0] ?? []) {
      x += point[0];
      y += point[1];
      count += 1;
    }
  }
  return count ? [x / count, y / count] : null;
}

async function parcelAt(key, domain, longitude, latitude) {
  const query = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: PARCEL_LAYER,
    key,
    domain,
    format: "json",
    crs: "EPSG:4326",
    geometry: "false",
    attribute: "true",
    size: "1",
    geomFilter: `POINT(${longitude} ${latitude})`
  });

  try {
    const response = await fetch(`${VWORLD_URL}?${query}`);
    if (!response.ok) return null;
    const payload = await response.json();
    const features =
      payload?.response?.result?.featureCollection?.features ?? [];
    return features[0]?.properties?.addr ?? null;
  } catch {
    return null;
  }
}

// "경기도 광명시 철산동 467-529" → { district, dong, mainLot }
function parseParcel(address) {
  if (!address) return null;
  const match = address.match(
    /경기도\s+([가-힣]+[시군])\s+(?:[가-힣]+구\s+)?([가-힣0-9]+(?:동|리|가))\s+(?:산\s*)?(\d+)(?:-(\d+))?/u
  );
  if (!match) return null;
  return {
    address,
    district: match[1],
    dong: match[2],
    mainLot: match[3]
  };
}

// 사업 현황 소재지에서 동 + 본번을 뽑는다.
function projectLot(project) {
  const location = String(project.location ?? "").replace(/\bnan\b/giu, " ");
  const match = location.match(/([가-힣0-9]+(?:동|리|가))\s*(\d+)/u);
  if (!match) return null;
  // 행정동(철산2동)은 법정동(철산동)으로 되돌린다.
  const dong = match[1].replace(/([가-힣]+?)\d+(가)?동$/u, "$1$2동");
  return { dong, mainLot: match[2] };
}

const env = loadEnv();
const apiKey = (process.env.VWORLD_API_KEY ?? env.VWORLD_API_KEY ?? "").trim();
const apiDomain = (process.env.VWORLD_DOMAIN ?? env.VWORLD_DOMAIN ?? "").trim();

if (!apiKey || !apiDomain) {
  throw new Error("VWORLD_API_KEY와 VWORLD_DOMAIN이 필요합니다.");
}

// 여러 번 실행해도 원천 명칭이 손상되지 않도록 Git 기준 파일에서 시작한다.
const baseline = execFileSync(
  "git",
  ["show", "HEAD:public/data/gyeonggi-legal-maintenance-zones.geojson"],
  { cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
);
const collection = JSON.parse(baseline);
const projects = JSON.parse(await readFile(PROJECT_PATH, "utf8")).projects ?? [];

// 이미 다른 구역에 붙은 사업명은 후보에서 제외한다.
const claimed = new Set(
  collection.features
    .filter((feature) => feature.properties.matchMethod !== "unmatched")
    .map((feature) => feature.properties.normalizedName)
);
const activeProjects = projects.filter(
  (project) =>
    !claimed.has(project.normalizedName) &&
    !FINISHED_STAGES.test(String(project.businessStage ?? ""))
);

const cache = existsSync(CACHE_PATH)
  ? JSON.parse(await readFile(CACHE_PATH, "utf8"))
  : {};

let labelled = 0;
let named = 0;
let districtFilled = 0;
let lookedUp = 0;

for (const feature of collection.features) {
  const properties = feature.properties;
  if (properties.matchMethod !== "unmatched") continue;

  const id = properties.sourceGeometryId ?? "";
  if (!(id in cache)) {
    const centre = centroidOf(feature.geometry);
    cache[id] = centre ? await parcelAt(apiKey, apiDomain, centre[0], centre[1]) : null;
    lookedUp += 1;
  }
  const parcel = parseParcel(cache[id]);

  // 지번에서 시군을 읽어 비어 있던 행정구역을 채운다.
  const district =
    parcel?.district || properties.districtName || DISTRICT_NAMES[properties.districtCode] || "";
  if (!properties.districtName && district) districtFilled += 1;
  properties.districtName = district;
  properties.regionName = `경기도 ${district}`.trim();

  if (parcel) {
    properties.parcelAddress = parcel.address;
  }

  // 같은 시군·법정동·본번을 가진 활성 사업이 정확히 하나일 때만 공식 사업명을 붙인다.
  const candidates = parcel
    ? activeProjects.filter((project) => {
        if (project.districtName !== parcel.district) return false;
        const lot = projectLot(project);
        return lot && lot.dong === parcel.dong && lot.mainLot === parcel.mainLot;
      })
    : [];

  if (candidates.length === 1) {
    const project = candidates[0];
    properties.projectName = project.projectName;
    properties.normalizedName = project.normalizedName;
    properties.projectType = project.projectType || properties.projectType;
    properties.stageName = project.businessStage || properties.stageName;
    properties.matchMethod = "parcel-jibun";
    properties.nameStatus = "matched-by-parcel";
    properties.showLabel = true;
    claimed.add(project.normalizedName);
    named += 1;
    labelled += 1;
    continue;
  }

  // 사업명을 못 찾으면 고시 식별자 대신 실제 지번으로 위치를 알린다.
  const label = parcel
    ? `${parcel.district} ${parcel.dong} ${parcel.mainLot} 일원 정비구역`
    : `${district || "경기"} 법정 정비구역 · 고시ID ${
        id.match(/(20\d{6})/u)?.[1] ?? "고시"
      }/${id.slice(-4)}`;

  properties.projectName = label;
  properties.normalizedName = label.replace(/[^0-9A-Za-z가-힣]/gu, "");
  properties.showLabel = true;
  properties.nameStatus = parcel ? "parcel-location-only" : "official-name-unmatched";
  labelled += 1;
}

collection.metadata.unmatchedLabelPolicy =
  "사업 현황과 일대일 매칭하지 못한 법정 경계는 구역 중심의 실제 지번으로 위치 라벨을 표시하며, 지번이 사업 소재지와 정확히 일치하는 경우에만 공식 사업명을 붙인다";

await mkdir(fileURLToPath(new URL("../downloads/", import.meta.url)), { recursive: true });
await writeFile(CACHE_PATH, `${JSON.stringify(cache)}\n`, "utf8");
await writeFile(DATA_PATH, `${JSON.stringify(collection)}\n`, "utf8");

console.log(
  `미매칭 법정 정비구역 ${labelled}건 라벨 갱신 (지번으로 사업명 확정 ${named}건, 행정구역 보정 ${districtFilled}건, 신규 조회 ${lookedUp}건)`
);
