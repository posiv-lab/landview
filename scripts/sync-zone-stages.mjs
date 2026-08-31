import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// 구역 폴리곤의 추진 단계를 최신 사업 현황으로 맞춘다.
//
// 서울플랜+(OA-22712)의 추진단계 코드는 신속통합기획 기획 진행도(기획완료 등)를 담고 있어
// 실제 정비사업 단계(조합설립·착공 등)와 다르다. 기준일도 사업 현황 쪽이 더 최신이다.
// 구역명이 정확히 하나로 매칭될 때만 단계를 갈아끼우고, 원본 단계는 따로 남긴다.
//
// 사용법: node scripts/sync-zone-stages.mjs

const DATA = (name) => fileURLToPath(new URL(`../public/data/${name}`, import.meta.url));

const ZONE_FILES = [
  {
    file: "seoul-project-zones.geojson",
    label: "서울 정비사업 구역",
    projects: ["seoul-maintenance-projects.json"]
  },
  {
    file: "gyeonggi-legal-maintenance-zones.geojson",
    label: "경기 법정 정비구역",
    projects: ["gyeonggi-maintenance-projects.json"]
  }
];

const SUFFIX =
  /(?:주택정비형|도시정비형|소규모|가로주택|주택)?(?:재개발|재건축)?(?:재정비촉진|정비사업|정비구역|지구단위계획구역|지구단위계획|사업)?(?:구역|지구)$/u;

function normalize(value) {
  let text = String(value ?? "")
    .replace(/\([^)]*\)/gu, "")
    .replace(/\s/gu, "");
  for (let index = 0; index < 4; index += 1) {
    const next = text.replace(SUFFIX, "");
    if (next === text) break;
    text = next;
  }
  return text.replace(/[^0-9A-Za-z가-힣]/gu, "");
}

// 라벨 스크립트 등 다른 후처리 결과를 지우지 않도록 현재 산출물에서 읽는다.
// 이미 동기화한 구역은 stageSource로 식별해 건너뛰므로 여러 번 실행해도 안전하다.
async function loadCollection(path) {
  return JSON.parse(await readFile(DATA(path), "utf8"));
}

let totalUpdated = 0;
let totalFilled = 0;

for (const target of ZONE_FILES) {
  const collection = await loadCollection(target.file);

  // 이름별 사업 현황 색인. 같은 이름이 둘 이상이면 판단하지 않는다.
  const index = new Map();
  let baseDate = "";
  for (const name of target.projects) {
    const payload = JSON.parse(await readFile(DATA(name), "utf8"));
    baseDate =
      payload.metadata?.sources?.[0]?.baseDate ??
      payload.projects?.[0]?.sourceBaseDate ??
      baseDate;
    for (const project of payload.projects ?? []) {
      const key = project.normalizedName || normalize(project.projectName);
      if (!key) continue;
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(project);
    }
  }

  let updated = 0;
  let filled = 0;

  for (const feature of collection.features) {
    const properties = feature.properties;
    const key = properties.normalizedName || normalize(properties.projectName);
    if (properties.stageSource) continue;

    const candidates = index.get(key) ?? [];
    if (candidates.length !== 1) continue;

    const stage = String(candidates[0].businessStage ?? "").trim();
    if (!stage) continue;

    const current = String(properties.stageName ?? "").trim();
    if (current === stage) continue;

    if (current) {
      // 신속통합기획 기획 진행도 등 원본 단계는 참고용으로 남긴다.
      properties.sourceStageName = current;
      updated += 1;
    } else {
      filled += 1;
    }

    properties.stageName = stage;
    properties.stageSource = candidates[0].sourceDataset ?? "사업 추진현황";
    if (baseDate) properties.stageBaseDate = baseDate;
  }

  collection.metadata.stagePolicy =
    "추진 단계는 구역 경계 자료보다 기준일이 앞서는 공식 사업 추진현황을 우선한다. 구역명이 1:1로 매칭될 때만 반영하며 원본 단계는 sourceStageName으로 보존한다";

  await writeFile(DATA(target.file), `${JSON.stringify(collection)}\n`, "utf8");
  console.log(
    `${target.label}: 단계 갱신 ${updated}건, 빈 단계 보강 ${filled}건 (기준 ${baseDate || "-"})`
  );
  totalUpdated += updated;
  totalFilled += filled;
}

console.log(`합계 — 갱신 ${totalUpdated}건, 보강 ${totalFilled}건`);
