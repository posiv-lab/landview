import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("비밀번호 재설정");

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";

  return (
    <AuthPageShell
      description="새 비밀번호를 설정하면 기존 로그인 세션이 모두 종료됩니다."
      eyebrow="ACCOUNT RECOVERY"
      title="비밀번호 재설정"
    >
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
