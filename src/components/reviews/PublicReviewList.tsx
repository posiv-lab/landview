import { Star } from "lucide-react";
import Link from "next/link";

import type { PublicReview } from "@/data-access/reviews";

const formatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function PublicReviewList({
  reviews,
  reviewCount,
  averageRating,
  page,
  pageSize,
}: {
  reviews: PublicReview[];
  reviewCount: number;
  averageRating: number;
  page: number;
  pageSize: number;
}) {
  const pageCount = Math.max(1, Math.ceil(reviewCount / pageSize));

  return (
    <section className="reviews-public">
      <div className="reviews-summary">
        <div>
          <strong>{averageRating.toFixed(1)}</strong>
          <span>평균 별점</span>
        </div>
        <div>
          <strong>{reviewCount.toLocaleString("ko-KR")}</strong>
          <span>전체 후기</span>
        </div>
      </div>
      {reviews.length ? (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article className="review-list-card" key={review.id}>
              <div className="review-list-card__top">
                <div className="review-card__stars" aria-label={`별점 ${review.rating}점`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      aria-hidden="true"
                      className={index < review.rating ? "is-filled" : undefined}
                      key={index}
                      size={17}
                    />
                  ))}
                </div>
                <time dateTime={review.createdAt}>
                  {formatter.format(new Date(review.createdAt))}
                </time>
              </div>
              <h2>{review.title}</h2>
              <p>{review.content}</p>
              <span className="review-list-card__author">{review.nickname}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="review-empty">
          <Star aria-hidden="true" size={28} />
          <h2>첫 후기를 기다리고 있습니다.</h2>
          <p>땅뷰를 사용한 경험을 가장 먼저 들려주세요.</p>
        </div>
      )}
      {pageCount > 1 ? (
        <nav aria-label="후기 페이지" className="pagination">
          {page > 1 ? <Link href={`/reviews?page=${page - 1}`}>이전</Link> : <span />}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={`/reviews?page=${page + 1}`}>다음</Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
