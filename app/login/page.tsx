import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "로그인 | LandView" };

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
      description="LandView 계정으로 로그인하고 후기와 저장 기능을 이용해보세요."
      eyebrow="LANDVIEW ACCOUNT"
      title="로그인"
    >
      <LoginForm nextPath={nextPath} />
    </AuthPageShell>
  );
}
