import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ message }, { status, headers });
}

export function validationError(error: ZodError) {
  return jsonError(error.issues[0]?.message ?? "입력값을 확인해주세요.", 400);
}
