"use client";

import { FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button";

export type ContactSource = "inline" | "modal";

type ContactFormProps = {
  source: ContactSource;
};

export function ContactForm({ source }: ContactFormProps) {
  const fieldId = useId();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const contact = String(form.get("contact") || "").trim();
    const inquiryType = String(form.get("inquiryType") || "");
    const region = String(form.get("region") || "").trim();
    const inquiry = String(form.get("inquiry") || "").trim();
    const privacy = form.get("privacy");
    const marketing = form.get("marketing");

    if (!name || !contact || !inquiryType || !region || !inquiry) {
      setIsError(true);
      setMessage("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!privacy) {
      setIsError(true);
      setMessage("개인정보 수집 및 이용 동의가 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          inquiryType,
          region,
          inquiry,
          privacy: Boolean(privacy),
          marketing: Boolean(marketing),
          source
        })
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "문의 접수에 실패했습니다.");
      }

      formElement.reset();
      setMessage("문의가 접수되었습니다. 확인 후 입력하신 연락처로 안내드리겠습니다.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "문의 접수에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form aria-busy={isSubmitting} className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${fieldId}-name`}>이름 또는 닉네임</label>
          <input
            autoComplete="name"
            id={`${fieldId}-name`}
            maxLength={80}
            name="name"
            placeholder="예: 김땅뷰"
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-contact`}>이메일 또는 휴대폰 번호</label>
          <input
            id={`${fieldId}-contact`}
            maxLength={120}
            name="contact"
            placeholder="예: hello@example.com"
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-type`}>문의 유형</label>
          <select defaultValue="" id={`${fieldId}-type`} name="inquiryType" required>
            <option disabled value="">
              선택해주세요
            </option>
            <option value="service">서비스 이용 문의</option>
            <option value="data">토지 데이터 문의</option>
            <option value="feature">기능 및 출시 문의</option>
            <option value="partnership">제휴 및 업무 문의</option>
            <option value="other">기타 문의</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${fieldId}-region`}>관심 지역</label>
          <input
            id={`${fieldId}-region`}
            maxLength={120}
            name="region"
            placeholder="예: 경기 양평군"
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${fieldId}-inquiry`}>문의 내용</label>
        <textarea
          id={`${fieldId}-inquiry`}
          maxLength={2000}
          name="inquiry"
          placeholder="궁금한 지역이나 필요한 기능을 자세히 알려주세요."
          required
          rows={5}
        />
      </div>
      <div className="consent-list">
        <label className="checkbox-field">
          <input name="privacy" required type="checkbox" />
          <span>개인정보 수집 및 이용에 동의합니다. 수집 정보는 문의 응대 목적으로만 사용됩니다.</span>
        </label>
        <label className="checkbox-field">
          <input name="marketing" type="checkbox" />
          <span>서비스 출시 및 업데이트 안내 수신에 동의합니다. 선택 동의이며 언제든 철회할 수 있습니다.</span>
        </label>
      </div>
      <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
        {isSubmitting ? "전송 중..." : "문의 보내기"}
      </Button>
      <p
        aria-live="polite"
        className={`form-message ${message ? (isError ? "form-message--error" : "form-message--success") : ""}`}
      >
        {message}
      </p>
    </form>
  );
}
