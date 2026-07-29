import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = "icn1";

const VWORLD_LAND_LEDGER_URL = "https://api.vworld.kr/ned/data/ladfrlList";
const PNU_PATTERN = /^\d{19}$/;

type LandLedgerRecord = {
  lastUpdtDt?: unknown;
  ldCodeNm?: unknown;
  lndcgrCodeNm?: unknown;
  lndpclAr?: unknown;
  mnnmSlno?: unknown;
  pnu?: unknown;
  regstrSeCodeNm?: unknown;
};

type LandLedgerPayload = {
  ladfrlVOList?: {
    error?: unknown;
    ladfrlVOList?: LandLedgerRecord | LandLedgerRecord[];
    message?: unknown;
    totalCount?: unknown;
  };
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

export async function GET(request: NextRequest) {
  const pnu = request.nextUrl.searchParams.get("pnu")?.trim() ?? "";

  if (!PNU_PATTERN.test(pnu)) {
    return NextResponse.json(
      {
        code: "INVALID_PNU",
        message: "19자리 PNU가 필요합니다."
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
    key: apiKey,
    domain: apiDomain,
    pnu,
    format: "json",
    numOfRows: "1",
    pageNo: "1"
  });

  try {
    const response = await fetch(`${VWORLD_LAND_LEDGER_URL}?${params.toString()}`, {
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          code: "VWORLD_UPSTREAM_ERROR",
          message: "토지대장 정보를 불러오지 못했습니다."
        },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as LandLedgerPayload;
    const wrapper = payload.ladfrlVOList;
    const upstreamError = textValue(wrapper?.error);

    if (!wrapper || Boolean(wrapper.error)) {
      return NextResponse.json(
        {
          code: "VWORLD_RESPONSE_ERROR",
          message:
            textValue(wrapper?.message) ||
            upstreamError ||
            "VWorld 토지대장 응답을 처리하지 못했습니다."
        },
        { status: 502 }
      );
    }

    const records = Array.isArray(wrapper.ladfrlVOList)
      ? wrapper.ladfrlVOList
      : wrapper.ladfrlVOList
        ? [wrapper.ladfrlVOList]
        : [];
    const record = records[0];
    const areaSquareMeters = Number(textValue(record?.lndpclAr));

    if (!record || !Number.isFinite(areaSquareMeters) || areaSquareMeters <= 0) {
      return NextResponse.json(
        {
          code: "LAND_LEDGER_NOT_FOUND",
          message: "해당 PNU의 토지대장 정보를 찾지 못했습니다."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        pnu: textValue(record.pnu) || pnu,
        areaSquareMeters,
        landCategory: textValue(record.lndcgrCodeNm),
        registerType: textValue(record.regstrSeCodeNm),
        lotNumber: textValue(record.mnnmSlno),
        legalDistrict: textValue(record.ldCodeNm),
        lastUpdatedDate: textValue(record.lastUpdtDt)
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    );
  } catch {
    return NextResponse.json(
      {
        code: "VWORLD_REQUEST_FAILED",
        message: "토지대장 조회가 지연되거나 네트워크 오류가 발생했습니다."
      },
      { status: 502 }
    );
  }
}
