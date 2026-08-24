import { readFile } from "node:fs/promises";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split(/\r?\n/u)
    .map((line) => line.match(/^([^#=]+)=(.*)$/u))
    .filter(Boolean)
    .map((match) => [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/gu, "")])
);
const tests = [
  ["urban-development", "LT_C_UPISUQ161", "dgm_nm:like:도시개발"],
  ["housing-site", "LT_C_UPISUQ161", "dgm_nm:like:택지개발"],
  ["industrial-complex", "LT_C_DAMDAN", ""],
  ["road-plan", "LT_C_UPISUQ151", "excut_se:=:EMA0002|grad_se:like:대로"],
  ["rail-plan", "LT_C_UPISUQ152", "excut_se:=:EMA0002|lclas_cl:=:UQS500"],
  [
    "traffic-plaza",
    "LT_C_UPISUQ153",
    "excut_se:=:EMA0002|lclas_cl:=:UQT100|mlsfc_cl:=:UQT110"
  ]
];

for (const [name, data, attrFilter] of tests) {
  const query = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data,
    key: env.VWORLD_API_KEY,
    domain: env.VWORLD_DOMAIN,
    format: "json",
    crs: "EPSG:4326",
    geometry: "true",
    attribute: "true",
    size: "1000",
    page: "1",
    geomFilter: "BOX(126.85,37.25,127.25,37.50)"
  });

  if (attrFilter) {
    query.set("attrFilter", attrFilter);
  }

  const response = await fetch(`https://api.vworld.kr/req/data?${query.toString()}`);
  const payload = await response.json();
  const features = payload?.response?.result?.featureCollection?.features || [];
  console.log(
    JSON.stringify({
      name,
      http: response.status,
      status: payload?.response?.status,
      total: payload?.response?.record?.total ?? features.length,
      first:
        features[0]?.properties?.dan_name || features[0]?.properties?.dgm_nm || null,
      classes: [
        ...new Set(
          features.flatMap(({ properties = {} }) => [
            properties.lcl_nam,
            properties.mls_nam,
            properties.scl_nam,
            properties.atr_nam
          ])
        )
      ].filter((value) => value && value !== "미분류").slice(0, 12),
      error: payload?.response?.error?.text || null
    })
  );
}
