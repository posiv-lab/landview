import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DATA_PATH = fileURLToPath(
  new URL("../public/data/gyeonggi-legal-maintenance-zones.geojson", import.meta.url)
);
const DISTRICT_NAMES = {
  "41110": "수원시",
  "41130": "성남시",
  "41150": "의정부시",
  "41170": "안양시",
  "41190": "부천시",
  "41210": "광명시",
  "41220": "평택시",
  "41250": "동두천시",
  "41270": "안산시",
  "41280": "고양시",
  "41290": "과천시",
  "41310": "구리시",
  "41360": "남양주시",
  "41370": "오산시",
  "41390": "시흥시",
  "41410": "군포시",
  "41430": "의왕시",
  "41450": "하남시",
  "41460": "용인시",
  "41480": "파주시",
  "41500": "이천시",
  "41550": "안성시",
  "41570": "김포시",
  "41590": "화성시",
  "41610": "광주시",
  "41630": "양주시",
  "41650": "포천시",
  "41670": "여주시",
  "41800": "연천군",
  "41820": "가평군",
  "41830": "양평군"
};

function fallbackName(properties) {
  const district = DISTRICT_NAMES[properties.districtCode] || "경기";
  const sourceId = properties.sourceGeometryId || "";
  const digits = sourceId.match(/(20\d{6})/u)?.[1];
  const noticeId = digits || "고시";
  const serial = sourceId.match(/(\d{4})$/u)?.[1] || sourceId.slice(-4);
  return `${district} 법정 정비구역 · 고시ID ${noticeId}/${serial}`;
}

// 현재 산출물을 여러 번 실행해도 원천 명칭이 손상되지 않도록 Git 기준 파일에서 시작한다.
const baseline = execFileSync(
  "git",
  ["show", "HEAD:public/data/gyeonggi-legal-maintenance-zones.geojson"],
  {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  }
);
const collection = JSON.parse(baseline);
let updated = 0;

collection.features.forEach((feature) => {
  const properties = feature.properties;

  if (properties.matchMethod !== "unmatched" || properties.showLabel !== false) {
    return;
  }

  const projectName = fallbackName(properties);
  properties.projectName = projectName;
  properties.normalizedName = projectName.replace(/[^0-9A-Za-z가-힣]/gu, "");
  properties.districtName =
    properties.districtName || DISTRICT_NAMES[properties.districtCode] || "";
  properties.regionName = `경기도 ${properties.districtName}`.trim();
  properties.showLabel = true;
  properties.nameStatus = "official-name-unmatched";
  updated += 1;
});
collection.metadata.unmatchedLabelPolicy =
  "공식 구역명과 사업 현황을 일대일 매칭하지 못한 법정 경계는 시·고시식별자로 탐색용 라벨을 표시하며 사업명으로 해석하지 않음";

await writeFile(DATA_PATH, `${JSON.stringify(collection)}\n`, "utf8");
console.log(`명칭 미매칭 법정 정비구역 ${updated}건에 탐색용 라벨을 추가했습니다.`);
