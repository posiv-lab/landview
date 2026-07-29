import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  deleteUserReview,
  updateUserReview,
} from "@/data-access/reviews";
import { jsonError, validationError } from "@/lib/api-response";
import {
  AuthenticationRequiredError,
  requireUser,
} from "@/lib/auth/authorization";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import { reviewIdSchema, reviewInputSchema } from "@/lib/validation/review";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function revalidateReviewPages() {
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/account");
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    const user = await requireUser();
    const id = reviewIdSchema.safeParse((await context.params).id);

    if (!id.success) {
      return jsonError("올바르지 않은 후기 번호입니다.", 400);
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

    const updated = await updateUserReview(id.data, user.id, parsed.data);
    if (!updated) {
      return jsonError("후기를 찾을 수 없거나 수정 권한이 없습니다.", 404);
    }

    revalidateReviewPages();
    return NextResponse.json({ message: "후기가 수정되었습니다." });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return jsonError(error.message, 401);
    }
    console.error("후기 수정 실패", error);
    return jsonError("후기를 수정하지 못했습니다.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return jsonError("허용되지 않은 요청입니다.", 403);
  }

  try {
    const user = await requireUser();
    const id = reviewIdSchema.safeParse((await context.params).id);

    if (!id.success) {
      return jsonError("올바르지 않은 후기 번호입니다.", 400);
    }

    const deleted = await deleteUserReview(id.data, user.id);
    if (!deleted) {
      return jsonError("후기를 찾을 수 없거나 삭제 권한이 없습니다.", 404);
    }

    revalidateReviewPages();
    return NextResponse.json({ message: "후기가 삭제되었습니다." });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return jsonError(error.message, 401);
    }
    console.error("후기 삭제 실패", error);
    return jsonError("후기를 삭제하지 못했습니다.", 500);
  }
}
