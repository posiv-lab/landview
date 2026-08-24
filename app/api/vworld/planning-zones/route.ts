import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const MAX_LONGITUDE_SPAN = 1.5;
const MAX_LATITUDE_SPAN = 1.5;

const categoryConfig = {
  maintenance: {
    label: "정비구역",
    layerId: "LT_C_UPISUQ161",
    filters: ["dgm_nm:like:정비", "dgm_nm:like:재개발", "dgm_nm:like:재건축"],
    sourceName: "국토교통부 VWorld 도시계획 공간정보"
  },
  "urban-development": {
    label: "도시개발구역",
    layerId: "LT_C_UPISUQ161",
    filters: ["dgm_nm:like:도시개발"],
    sourceName: "국토교통부 VWorld 도시계획 공간정보"
  },
  "housing-site": {
    label: "택지개발지구",
    layerId: "LT_C_UPISUQ161",
    filters: ["dgm_nm:like:택지개발"],
    sourceName: "국토교통부 VWorld 도시계획 공간정보"
  },
  "industrial-complex": {
    label: "산업단지",
    layerId: "LT_C_DAMDAN",
    filters: [""],
    sourceName: "국토교통부 VWorld 산업단지 공간정보"
  },
  "road-plan": {
    label: "미집행·부분집행 간선도로",
    layerId: "LT_C_UPISUQ151",
    filters: [
      "excut_se:=:EMA0002|grad_se:like:대로",
      "excut_se:=:EMA0003|grad_se:like:대로"
    ],
    sourceName: "국토교통부 VWorld 도시계획시설(도로)"
  },
  "rail-plan": {
    label: "철도계획시설",
    layerId: "LT_C_UPISUQ152",
    filters: [
      "excut_se:=:EMA0002|lclas_cl:=:UQS500",
      "excut_se:=:EMA0003|lclas_cl:=:UQS500"
    ],
    sourceName: "국토교통부 VWorld 도시계획시설(교통시설)"
  },
  "traffic-plaza": {
    label: "교통광장·IC",
    layerId: "LT_C_UPISUQ153",
    filters: [
      "excut_se:=:EMA0002|lclas_cl:=:UQT100|mlsfc_cl:=:UQT110",
      "excut_se:=:EMA0003|lclas_cl:=:UQT100|mlsfc_cl:=:UQT110"
    ],
    sourceName: "국토교통부 VWorld 도시계획시설(공간시설)"
  }
} as const;

type PlanningCategory = keyof typeof categoryConfig;

type SafeFeature = {
  geometry: unknown;
  id: string;
  properties: {
    areaSquareMeters: number | null;
    category: PlanningCategory;
    classification: string;
    districtCode: string;
    noticeId: string;
    programTags: string[];
    projectName: string;
    projectType: string;
    regionName: string;
    sourceName: string;
    statusName: string;
  };
  type: "Feature";
};

function textValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function numberValue(value: unknown) {
  const number = Number(textValue(value).replaceAll(",", ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function programTags(projectName: string) {
  const tags: string[] = [];

  if (projectName.includes("공공재개발")) {
    tags.push("public_redevelopment");
  }
  if (projectName.includes("공공재건축")) {
    tags.push("public_reconstruction");
  }
  if (projectName.includes("재정비촉진")) {
    tags.push("renewal_promotion_district");
  }
  if (projectName.includes("신속통합")) {
    tags.push("fast_track_planning");
  }
  if (projectName.includes("모아타운")) {
    tags.push("moa_town");
  }
  if (projectName.includes("역세권")) {
    tags.push("station_area");
  }

  return tags;
}

function parseBbox(value: string | null) {
  if (!value) {
    return null;
  }

  const coordinates = value.split(",").map(Number);

  if (coordinates.length !== 4 || coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return null;
  }

  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = coordinates;

  if (
    minLongitude >= maxLongitude ||
    minLatitude >= maxLatitude ||
    minLongitude < 123 ||
    maxLongitude > 133 ||
    minLatitude < 32 ||
    maxLatitude > 40 ||
    maxLongitude - minLongitude > MAX_LONGITUDE_SPAN ||
    maxLatitude - minLatitude > MAX_LATITUDE_SPAN
  ) {
    return null;
  }

  return { minLongitude, minLatitude, maxLongitude, maxLatitude };
}

function isPlanningCategory(value: string | null): value is PlanningCategory {
  return Boolean(value && Object.hasOwn(categoryConfig, value));
}

async function requestFeatures(params: {
  apiDomain: string;
  apiKey: string;
  bbox: NonNullable<ReturnType<typeof parseBbox>>;
  attrFilter: string;
  layerId: string;
}) {
  const query = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: params.layerId,
    key: params.apiKey,
    domain: params.apiDomain,
    format: "json",
    crs: "EPSG:4326",
    geometry: "true",
    attribute: "true",
    size: "1000",
    page: "1",
    geomFilter: `BOX(${params.bbox.minLongitude},${params.bbox.minLatitude},${params.bbox.maxLongitude},${params.bbox.maxLatitude})`
  });

  if (params.attrFilter) {
    query.set("attrFilter", params.attrFilter);
  }
  const response = await fetch(`${VWORLD_DATA_URL}?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error("VWORLD_UPSTREAM_ERROR");
  }

  const payload = await response.json();
  const vworldResponse = payload?.response;

  if (vworldResponse?.status === "NOT_FOUND") {
    return { features: [] as unknown[], total: 0 };
  }

  if (vworldResponse?.status !== "OK") {
    throw new Error(textValue(vworldResponse?.error?.text) || "VWORLD_RESPONSE_ERROR");
  }

  const featureCollection = vworldResponse?.result?.featureCollection;
  const features = Array.isArray(featureCollection?.features)
    ? featureCollection.features
    : [];
  const total = Number(vworldResponse?.record?.total ?? features.length);

  return {
    features,
    total: Number.isFinite(total) ? total : features.length
  };
}

function regionName(properties: Record<string, unknown>) {
  const code = textValue(properties.sig_nam) || textValue(properties.signgu_se).slice(0, 2);

  return code === "11"
    ? "서울특별시"
    : code === "28"
      ? "인천광역시"
      : code === "41"
        ? "경기도"
        : code;
}

function noticeLabel(properties: Record<string, unknown>) {
  const value = textValue(properties.ntfc_sn) || textValue(properties.wtnnc_sn);
  const date = value.match(/(20\d{6})/u)?.[1];

  return date
    ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    : textValue(properties.present_sn).slice(-6);
}

function projectName(category: PlanningCategory, properties: Record<string, unknown>) {
  if (category === "industrial-complex") {
    return textValue(properties.dan_name);
  }

  if (category === "road-plan") {
    const roadClass = textValue(properties.dgm_nm) || textValue(properties.atr_nam);
    const roadNumber = textValue(properties.road_no);
    return `${roadClass}${roadNumber ? `-${roadNumber}호` : ""} 도시계획도로`;
  }

  if (category === "rail-plan") {
    const railType =
      textValue(properties.atr_nam) ||
      textValue(properties.mls_nam) ||
      textValue(properties.dgm_nm) ||
      "철도";
    return `${railType} 계획${noticeLabel(properties) ? ` · ${noticeLabel(properties)}` : ""}`;
  }

  if (category === "traffic-plaza") {
    const plazaType =
      textValue(properties.scl_nam) !== "미분류"
        ? textValue(properties.scl_nam)
        : textValue(properties.dgm_nm) || "교통광장";
    return `${plazaType} 계획${noticeLabel(properties) ? ` · ${noticeLabel(properties)}` : ""}`;
  }

  return textValue(properties.dgm_nm);
}

function classification(category: PlanningCategory, properties: Record<string, unknown>) {
  if (category === "industrial-complex") {
    return textValue(properties.cat_nam) || "산업단지";
  }

  return [
    properties.lcl_nam,
    properties.mls_nam,
    properties.scl_nam,
    properties.atr_nam,
    properties.pmi_nam,
    properties.exc_nam
  ]
    .map(textValue)
    .filter(
      (value, index, values) =>
        Boolean(value) && value !== "미분류" && values.indexOf(value) === index
    )
    .join(" > ");
}

export async function GET(request: NextRequest) {
  const bbox = parseBbox(request.nextUrl.searchParams.get("bbox"));
  const category = request.nextUrl.searchParams.get("category");

  if (!bbox || !isPlanningCategory(category)) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: "유효한 수도권 지도 영역과 구역 종류가 필요합니다."
      },
      { status: 400 }
    );
  }

  // LT_C_UPISUQ161 is a district-unit planning layer, not the legal maintenance
  // district dataset (UD602). Never return name-filtered UQ161 features as legal
  // maintenance boundaries.
  if (category === "maintenance") {
    return NextResponse.json(
      {
        type: "FeatureCollection",
        category,
        features: [],
        total: 0,
        truncated: false
      },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  }

  const apiKey = process.env.VWORLD_API_KEY?.trim();
  const apiDomain = process.env.VWORLD_DOMAIN?.trim();

  if (!apiKey || !apiDomain) {
    return NextResponse.json(
      {
        code: "VWORLD_NOT_CONFIGURED",
        message: "VWorld API 환경변수가 설정되지 않았습니다."
      },
      { status: 503 }
    );
  }

  try {
    const config = categoryConfig[category];
    const results = await Promise.all(
      config.filters.map((attrFilter) =>
        requestFeatures({
          apiDomain,
          apiKey,
          attrFilter,
          bbox,
          layerId: config.layerId
        })
      )
    );
    const featuresById = new Map<string, SafeFeature>();

    results.flatMap((result) => result.features).forEach((feature: unknown) => {
      if (typeof feature !== "object" || feature === null) {
        return;
      }

      const candidate = feature as {
        geometry?: unknown;
        id?: unknown;
        properties?: Record<string, unknown>;
      };
      const properties = candidate.properties ?? {};
      const featureProjectName = projectName(category, properties);
      const id =
        textValue(properties.dan_id) ||
        textValue(properties.present_sn) ||
        textValue(candidate.id) ||
        `${category}:${featureProjectName}:${textValue(properties.signgu_se)}`;

      if (!candidate.geometry || !featureProjectName || featuresById.has(id)) {
        return;
      }

      featuresById.set(id, {
        type: "Feature",
        id,
        geometry: candidate.geometry,
        properties: {
          areaSquareMeters: numberValue(properties.dgm_ar),
          category,
          classification: classification(category, properties),
          districtCode: textValue(properties.signgu_se),
          noticeId: textValue(properties.ntfc_sn) || textValue(properties.wtnnc_sn),
          programTags: programTags(featureProjectName),
          projectName: featureProjectName,
          projectType:
            category === "industrial-complex"
              ? textValue(properties.cat_nam) || config.label
              : config.label,
          regionName: regionName(properties),
          sourceName: config.sourceName,
          statusName: textValue(properties.exc_nam)
        }
      });
    });

    const features = [...featuresById.values()];
    const truncated = results.some((result) => result.total > result.features.length);

    return NextResponse.json(
      {
        type: "FeatureCollection",
        category,
        features,
        total: features.length,
        truncated
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
        }
      }
    );
  } catch {
    return NextResponse.json(
      {
        code: "VWORLD_REQUEST_FAILED",
        message: "도시계획 구역 조회가 지연되거나 네트워크 오류가 발생했습니다."
      },
      { status: 502 }
    );
  }
}
