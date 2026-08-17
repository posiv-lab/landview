import { NextRequest, NextResponse } from "next/server";
import { findIncheonMaintenanceProject } from "@/lib/development/maintenance";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const regionCode = request.nextUrl.searchParams.get("regionCode")?.trim() ?? "";

  if (name.length < 2 || name.length > 300 || regionCode !== "28") {
    return NextResponse.json(
      {
        code: "INVALID_MAINTENANCE_PROJECT",
        message: "유효한 인천 정비사업 구역명이 필요합니다."
      },
      { status: 400 }
    );
  }

  const project = await findIncheonMaintenanceProject(name);

  if (!project) {
    return NextResponse.json(
      {
        code: "MAINTENANCE_PROJECT_NOT_FOUND",
        message: "인천광역시 공식 추진현황과 일치하는 사업을 찾지 못했습니다."
      },
      { status: 404 }
    );
  }

  return NextResponse.json(project, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
