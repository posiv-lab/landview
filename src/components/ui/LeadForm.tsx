"use client";

import { FormEvent, useState } from "react";
import { Button } from "./Button";

export function LeadForm() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const contact = String(form.get("contact") || "").trim();
    const region = String(form.get("region") || "").trim();
    const privacy = form.get("privacy");

    if (!name || !contact || !region) {
      setIsError(true);
      setMessage("이름, 연락처, 관심 지역을 모두 입력해주세요.");
      return;
    }

    if (!privacy) {
      setIsError(true);
      setMessage("개인정보 수집 및 이용 동의가 필요합니다.");
      return;
    }

    event.currentTarget.reset();
    setIsError(false);
    setMessage("신청이 접수되었습니다. 출시 준비가 완료되면 입력하신 연락처로 안내드리겠습니다.");
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="lead-name">이름 또는 닉네임</label>
          <input id="lead-name" name="name" placeholder="예: 김땅뷰" />
        </div>
        <div className="field">
          <label htmlFor="lead-contact">이메일 또는 휴대폰 번호</label>
          <input id="lead-contact" name="contact" placeholder="예: hello@example.com" />
        </div>
        <div className="field">
          <label htmlFor="lead-region">관심 지역</label>
          <input id="lead-region" name="region" placeholder="예: 경기 양평군" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lead-purpose">이용 목적</label>
        <select defaultValue="" id="lead-purpose" name="purpose">
          <option disabled value="">
            선택해주세요
          </option>
          <option value="owner">내 땅 확인</option>
          <option value="buy">매수 검토</option>
          <option value="sell">매도 검토</option>
          <option value="work">업무용 조회</option>
          <option value="learn">기초 정보 학습</option>
        </select>
      </div>
      <div className="consent-list">
        <label className="checkbox-field">
          <input name="privacy" type="checkbox" />
          <span>개인정보 수집 및 이용에 동의합니다. 수집 정보는 출시 알림과 문의 응대 목적으로만 사용됩니다.</span>
        </label>
        <label className="checkbox-field">
          <input name="marketing" type="checkbox" />
          <span>서비스 출시 및 업데이트 안내 수신에 동의합니다. 선택 동의이며 언제든 철회할 수 있습니다.</span>
        </label>
      </div>
      <Button size="lg" type="submit">
        출시 알림 신청하기
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
