"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { UserReview } from "@/data-access/reviews";

type ApiMessage = { message?: string };

export function ReviewEditor({
  review,
  isLoggedIn,
}: {
  review: UserReview | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="review-editor__locked" id="write-review">
        <h2>후기를 남겨보세요</h2>
        <p>후기는 로그인한 회원만 작성할 수 있습니다.</p>
        <div className="button-row">
          <Button href="/login?next=/reviews%23write-review">로그인</Button>
          <Button href="/signup" variant="secondary">
            회원가입
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch(review ? `/api/reviews/${review.id}` : "/api/reviews", {
      method: review ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        title: form.get("title"),
        content: form.get("content"),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiMessage;

    setPending(false);
    setMessage(data.message ?? "요청을 처리하지 못했습니다.");
    setSuccess(response.ok);
    if (response.ok) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!review || !window.confirm("작성한 후기를 삭제할까요?")) {
      return;
    }
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/reviews/${review.id}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as ApiMessage;
    setPending(false);
    setMessage(data.message ?? "요청을 처리하지 못했습니다.");
    setSuccess(response.ok);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="review-editor" id="write-review">
      <div className="review-editor__heading">
        <div>
          <p className="eyebrow">MEMBER REVIEW</p>
          <h2>{review ? "내 후기 수정" : "후기 작성"}</h2>
        </div>
        {review ? <span>후기는 계정당 1개까지 작성할 수 있습니다.</span> : null}
      </div>
      <form className="review-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>별점</legend>
          <div className="rating-input">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return (
                <button
                  aria-label={`${value}점`}
                  className={value <= rating ? "is-selected" : undefined}
                  key={value}
                  onClick={() => setRating(value)}
                  type="button"
                >
                  <Star aria-hidden="true" size={28} />
                </button>
              );
            })}
            <strong>{rating}점</strong>
          </div>
        </fieldset>
        <label>
          제목
          <input
            defaultValue={review?.title ?? ""}
            maxLength={100}
            name="title"
            placeholder="후기를 한 문장으로 요약해주세요"
            required
          />
        </label>
        <label>
          내용
          <textarea
            defaultValue={review?.content ?? ""}
            maxLength={999}
            minLength={5}
            name="content"
            placeholder="LandView를 사용하며 좋았던 점이나 개선이 필요한 점을 알려주세요."
            required
            rows={7}
          />
          <small>5자 이상 1,000자 미만</small>
        </label>
        {message ? (
          <p
            className={`form-message ${success ? "form-message--success" : "form-message--error"}`}
            role={success ? "status" : "alert"}
          >
            {message}
          </p>
        ) : null}
        <div className="button-row">
          <Button disabled={pending} type="submit">
            {pending ? "저장 중..." : review ? "후기 수정" : "후기 등록"}
          </Button>
          {review ? (
            <Button
              disabled={pending}
              onClick={handleDelete}
              type="button"
              variant="ghost"
            >
              후기 삭제
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
