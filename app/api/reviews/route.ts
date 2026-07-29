import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  createUserReview,
  getPublicReviewPage,
  getUserReview,
} from "@/data-access/reviews";
import { jsonError, validationError } from "@/lib/api-response";
import {
  AuthenticationRequiredError,
  requireUser,
} from "@/lib/auth/authorization";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { hashMetadata } from "@/lib/auth/tokens";
import { reviewInputSchema } from "@/lib/validation/review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page") ?? "1");

  try {
    const result = await getPublicReviewPage(page, 12);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("후기 목록 조회 실패", error);
    return jsonError("후기를 불러오지 못했습니다.", 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    const user = await requireUser();
    const rateLimit = await consumeRateLimit(
      `review:${hashMetadata(user.id)}`,
      5,
      60 * 60 * 1000,
    );

    if (!rateLimit.allowed) {
      return jsonError("후기 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return jsonError("요청 형식을 확인해주세요.", 400);
    }

    const parsed = reviewInputSchema.safeParse(input);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    if (await getUserReview(user.id)) {
      return jsonError("이미 작성한 후기가 있습니다.", 409);
    }

    const review = await createUserReview(user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath("/account");
    return NextResponse.json(
      { message: "후기가 등록되었습니다.", review },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return jsonError(error.message, 401);
    }
    console.error("후기 등록 실패", error);
    return jsonError("후기를 등록하지 못했습니다.", 500);
  }
}
