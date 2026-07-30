import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("로그인");

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) {
    redirect("/account");
  }
  const nextPath = (await searchParams).next;

  return (
    <AuthPageShell
      description="땅뷰 계정으로 로그인하고 후기와 저장 기능을 이용해보세요."
      eyebrow="LANDVIEW ACCOUNT"
      title="로그인"
    >
      <LoginForm nextPath={nextPath} />
    </AuthPageShell>
  );
}
