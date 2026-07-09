"use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "./Button";

export function SearchBox() {
  const [region, setRegion] = useState("");
  const [message, setMessage] = useState("예시 지역을 입력하면 출시 알림 신청으로 이어집니다.");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = region.trim();

    if (!normalized) {
      setMessage("관심 지역을 입력해주세요.");
      return;
    }

    setMessage(`${normalized} 지역은 출시 알림 신청에서 관심 지역으로 남길 수 있습니다.`);
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <div className="search-box__row">
        <label className="search-box__field">
          <Search aria-hidden="true" color="var(--text-placeholder)" size={20} />
          <span className="sr-only">관심 지역</span>
          <input
            autoComplete="address-level2"
            onChange={(event) => setRegion(event.target.value)}
            placeholder="예: 경기 양평군, 제주 한림읍"
            value={region}
          />
        </label>
        <Button size="lg" type="submit">
          우리 동네 땅값 확인하기
        </Button>
      </div>
      <p className="search-box__hint">{message}</p>
    </form>
  );
}
