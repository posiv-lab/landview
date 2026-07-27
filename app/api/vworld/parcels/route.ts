import { NextRequest, NextResponse } from "next/server";

const VWORLD_DATA_URL = "https://api.vworld.kr/req/data";
const PARCEL_LAYER_ID = "LP_PA_CBND_BUBUN";
const MAX_LONGITUDE_SPAN = 0.08;
const MAX_LATITUDE_SPAN = 0.08;

type FeatureCollection = {
  type: "FeatureCollection";
  features: unknown[];
};

function emptyFeatureCollection(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  };
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

  return {
    minLongitude,
    minLatitude,
    maxLongitude,
    maxLatitude
  };
}

export async function GET(request: NextRequest) {
  const bbox = parseBbox(request.nextUrl.searchParams.get("bbox"));

  if (!bbox) {
    return NextResponse.json(
      {
        code: "INVALID_BBOX",
        message: "대한민국 내의 유효한 소규모 지도 영역이 필요합니다."
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

  const params = new URLSearchParams({
    service: "data",
    request: "GetFeature",
    data: PARCEL_LAYER_ID,
    key: apiKey,
    domain: apiDomain,
    format: "json",
    crs: "EPSG:4326",
    geometry: "true",
    attribute: "true",
    size: "1000",
    page: "1",
    geomFilter: `BOX(${bbox.minLongitude},${bbox.minLatitude},${bbox.maxLongitude},${bbox.maxLatitude})`
  });

  try {
    const response = await fetch(`${VWORLD_DATA_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          code: "VWORLD_UPSTREAM_ERROR",
          message: "VWorld 공간정보를 불러오지 못했습니다."
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const vworldResponse = payload?.response;

    if (vworldResponse?.status === "NOT_FOUND") {
      return NextResponse.json(emptyFeatureCollection(), {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
        }
      });
    }

    if (vworldResponse?.status !== "OK") {
      return NextResponse.json(
        {
          code: "VWORLD_RESPONSE_ERROR",
          message:
            vworldResponse?.error?.text ??
            vworldResponse?.error?.message ??
            "VWorld 응답을 처리하지 못했습니다."
        },
        { status: 502 }
      );
    }

    const featureCollection = vworldResponse?.result?.featureCollection;

    if (!featureCollection || featureCollection.type !== "FeatureCollection") {
      return NextResponse.json(emptyFeatureCollection());
    }

    return NextResponse.json(featureCollection, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600"
      }
    });
  } catch {
    return NextResponse.json(
      {
        code: "VWORLD_REQUEST_FAILED",
        message: "VWorld 요청 시간이 초과되었거나 네트워크 오류가 발생했습니다."
      },
      { status: 502 }
    );
  }
}
