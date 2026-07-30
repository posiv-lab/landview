import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("비밀번호 찾기");

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      description="가입한 이메일로 한 번만 사용할 수 있는 재설정 링크를 보내드립니다."
      eyebrow="ACCOUNT RECOVERY"
      title="비밀번호 찾기"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
