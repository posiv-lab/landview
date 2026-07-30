export function getMemberServiceSetupMessage(error: unknown) {
  if (
    !process.env.SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SECRET_KEY?.trim()
  ) {
    return "Vercel의 Supabase 서버 환경변수를 설정해주세요.";
  }

  if (typeof error === "object" && error !== null) {
    const code = "code" in error ? String(error.code) : "";
    const message = "message" in error ? String(error.message) : "";

    if (
      code === "PGRST202" ||
      code === "42883" ||
      message.includes("consume_auth_rate_limit")
    ) {
      return "Supabase SQL Editor에서 회원 기능 마이그레이션을 실행해주세요.";
    }
  }

  return "회원 서비스 연결을 확인해주세요.";
}
