import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/Button";
import { getUserReview } from "@/data-access/reviews";
import { getCurrentUser } from "@/lib/auth/session";
import { createPrivateMetadata } from "@/lib/seo";

export const metadata = createPrivateMetadata("내 계정");
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const review = await getUserReview(user.id).catch(() => null);

  return (
    <div className="site-shell">
      <Header />
      <main className="account-page">
        <div className="container account-layout">
          <section className="account-profile">
            <p className="eyebrow">MY LANDVIEW</p>
            <h1>{user.nickname}님, 안녕하세요.</h1>
            <dl>
              <div>
                <dt>이메일</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>계정 유형</dt>
                <dd>{user.role === "member" ? "일반 회원" : user.role}</dd>
              </div>
            </dl>
            <LogoutButton />
          </section>
          <section className="account-review">
            <p className="eyebrow">MY REVIEW</p>
            <h2>{review ? "작성한 후기가 있습니다." : "아직 작성한 후기가 없습니다."}</h2>
            <p>
              {review
                ? `별점 ${review.rating}점 · ${review.title ?? "땅뷰 사용 후기"}`
                : "땅뷰 사용 경험을 다른 사용자와 공유해보세요."}
            </p>
            <Button href="/reviews#write-review">
              {review ? "후기 수정하기" : "후기 작성하기"}
            </Button>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
