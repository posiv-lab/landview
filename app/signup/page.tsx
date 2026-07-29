import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "회원가입 | LandView" };

export default async function SignupPage() {
  if (await getCurrentUser()) {
    redirect("/account");
  }

  return (
    <AuthPageShell
      description="이메일 인증을 완료하면 LandView 후기를 작성하고 계정 기능을 이용할 수 있습니다."
      eyebrow="LANDVIEW ACCOUNT"
      title="회원가입"
    >
      <SignupForm />
    </AuthPageShell>
  );
}
