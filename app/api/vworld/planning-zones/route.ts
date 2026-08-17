import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const PLANNING_ZONE_LAYER_ID = "LT_C_UPISUQ161";
const MAX_LONGITUDE_SPAN = 1.5;
const MAX_LATITUDE_SPAN = 1.5;

const categoryConfig = {
  maintenance: {
    label: "정비구역",
    keywords: ["정비", "재개발", "재건축"]
  },
  "urban-development": {
    label: "도시개발구역",
    keywords: ["도시개발"]
  },
  "housing-site": {
    label: "택지개발지구",
    keywords: ["택지개발"]
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
    sourceName: "국토교통부 VWorld 도시계획 공간정보";
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

async function requestKeyword(params: {
  apiDomain: string;
  apiKey: string;
  bbox: NonNullable<ReturnType<typeof parseBbox>>;
  keyword: string;
}) {
  const query = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: PLANNING_ZONE_LAYER_ID,
    key: params.apiKey,
    domain: params.apiDomain,
    format: "json",
    crs: "EPSG:4326",
    geometry: "true",
    attribute: "true",
    size: "1000",
    page: "1",
    geomFilter: `BOX(${params.bbox.minLongitude},${params.bbox.minLatitude},${params.bbox.maxLongitude},${params.bbox.maxLatitude})`,
    attrFilter: `dgm_nm:like:${params.keyword}`
  });
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
    const results = await Promise.all(
      categoryConfig[category].keywords.map((keyword) =>
        requestKeyword({ apiDomain, apiKey, bbox, keyword })
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
      const projectName = textValue(properties.dgm_nm);
      const id =
        textValue(properties.present_sn) ||
        textValue(candidate.id) ||
        `${category}:${projectName}:${textValue(properties.signgu_se)}`;

      if (!candidate.geometry || !projectName || featuresById.has(id)) {
        return;
      }

      const classification = [
        properties.lcl_nam,
        properties.mls_nam,
        properties.scl_nam,
        properties.atr_nam
      ]
        .map(textValue)
        .filter((value, index, values) => Boolean(value) && values.indexOf(value) === index)
        .join(" > ");

      featuresById.set(id, {
        type: "Feature",
        id,
        geometry: candidate.geometry,
        properties: {
          areaSquareMeters: numberValue(properties.dgm_ar),
          category,
          classification,
          districtCode: textValue(properties.signgu_se),
          noticeId: textValue(properties.ntfc_sn) || textValue(properties.wtnnc_sn),
          programTags: programTags(projectName),
          projectName,
          projectType: categoryConfig[category].label,
          regionName: textValue(properties.sig_nam),
          sourceName: "국토교통부 VWorld 도시계획 공간정보",
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
