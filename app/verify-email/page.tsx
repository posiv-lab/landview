import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { VerifyEmailForm } from "@/components/auth/AuthForms";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("이메일 인증");

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";

  return (
    <AuthPageShell
      description="안전한 회원가입을 위해 이메일 주소를 확인합니다."
      eyebrow="EMAIL VERIFICATION"
      title="이메일 인증"
    >
      <VerifyEmailForm token={token} />
    </AuthPageShell>
  );
}
