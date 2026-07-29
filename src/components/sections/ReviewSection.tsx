import { Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getHomeReviewData } from "@/data-access/reviews";

const reviewDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div
      className="review-card__stars"
      aria-label={`별점 ${rating}점`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          aria-hidden="true"
          className={index < rating ? "is-filled" : undefined}
          key={index}
          size={18}
        />
      ))}
    </div>
  );
}

export async function ReviewSection() {
  const { reviews, reviewCount, averageRating, configured } =
    await getHomeReviewData();
  const hasReviews = reviewCount > 0 && reviews.length > 0;

  return (
    <section className="section section--subtle" id="reviews">
      <div className="container">
        <div className="review-section__top">
          <div className="section-header">
            <div>
              <Badge variant="neutral">사용자 후기</Badge>
            </div>
            <h2 className="section-title">
              LandView를 먼저 경험한 분들의 이야기
            </h2>
            <p className="section-description">
              후기는 로그인한 회원만 작성할 수 있으며, 공개 상태인 후기만
              표시됩니다.
            </p>
          </div>

          {hasReviews ? (
            <div className="review-summary" aria-label="후기 평점 요약">
              <Star aria-hidden="true" className="is-filled" size={22} />
              <strong>
                {averageRating.toLocaleString("ko-KR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </strong>
              <span>후기 {reviewCount.toLocaleString("ko-KR")}개</span>
            </div>
          ) : null}
        </div>

        {hasReviews ? (
          <div className="review-grid">
            {reviews.map((review) => (
              <Card className="review-card" key={review.id}>
                <ReviewStars rating={review.rating} />
                <h3>{review.title}</h3>
                <p className="review-card__content">{review.content}</p>
                <div className="review-card__meta">
                  <span>{review.nickname}</span>
                  <time dateTime={review.createdAt}>
                    {reviewDateFormatter.format(new Date(review.createdAt))}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="review-empty">
            <Star aria-hidden="true" size={28} />
            <h3>
              {configured
                ? "첫 후기를 기다리고 있습니다."
                : "후기 기능을 준비하고 있습니다."}
            </h3>
            <p>
              회원 기능이 연결되면 로그인 후 LandView 사용 경험을 남길 수
              있습니다.
            </p>
          </div>
        )}
        <div className="review-section__actions">
          <Button href="/reviews">후기 전체보기</Button>
          <Button href="/reviews#write-review" variant="secondary">
            후기 작성하기
          </Button>
        </div>
      </div>
    </section>
  );
}
