import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PublicReviewList } from "@/components/reviews/PublicReviewList";
import { ReviewEditor } from "@/components/reviews/ReviewEditor";
import {
  getPublicReviewPage,
  getUserReview,
} from "@/data-access/reviews";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "사용자 후기 | LandView" };
export const revalidate = 60;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const user = await getCurrentUser();
  const [publicReviews, userReview] = await Promise.all([
    getPublicReviewPage(page, 12).catch(() => ({
      reviews: [],
      reviewCount: 0,
      averageRating: 0,
      page,
      pageSize: 12,
    })),
    user ? getUserReview(user.id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="site-shell">
      <Header />
      <main className="reviews-page">
        <section className="reviews-hero">
          <div className="container">
            <p className="eyebrow">LANDVIEW REVIEWS</p>
            <h1>사용자 후기</h1>
            <p>
              LandView를 사용한 회원들의 실제 경험을 확인하고 의견을
              남겨보세요.
            </p>
          </div>
        </section>
        <div className="container reviews-layout">
          <PublicReviewList {...publicReviews} />
          <ReviewEditor
            isLoggedIn={Boolean(user)}
            key={userReview?.id ?? "new-review"}
            review={userReview}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
