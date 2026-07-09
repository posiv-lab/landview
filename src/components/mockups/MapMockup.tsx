import { Layers, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function MapMockup() {
  return (
    <div
      aria-label="지도 위에 필지 경계와 토지 정보 패널이 표시된 땅뷰 화면 예시"
      className="map-mockup"
      role="img"
    >
      <div className="map-mockup__toolbar" aria-hidden="true">
        <span className="map-pill">필지</span>
        <span className="map-pill">실거래</span>
        <span className="map-pill">규제</span>
      </div>
      <div className="parcel-shape parcel-shape--a" aria-hidden="true" />
      <div className="parcel-shape parcel-shape--b" aria-hidden="true" />
      <div className="parcel-shape parcel-shape--c" aria-hidden="true" />

      <div className="mock-panel mock-panel--side">
        <div className="mock-panel__head">
          <div>
            <p>선택 지역 예시</p>
            <h3>경기 양평군 서종면</h3>
          </div>
          <MapPin aria-hidden="true" color="var(--brand)" size={20} />
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span>확인 필지</span>
            <strong>128건</strong>
          </div>
          <div className="metric">
            <span>최근 거래</span>
            <strong>24건</strong>
          </div>
        </div>
        <Badge variant="neutral">예시 화면</Badge>
      </div>

      <div className="mock-panel mock-panel--main">
        <div className="mock-panel__head">
          <div>
            <p>필지 요약 예시</p>
            <h3>계획관리지역 · 답 · 1,286㎡</h3>
          </div>
          <Layers aria-hidden="true" color="var(--info-fg)" size={20} />
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span>공시지가</span>
            <strong>148,000원/㎡</strong>
          </div>
          <div className="metric">
            <span>주변 실거래</span>
            <strong>182,000원/㎡</strong>
          </div>
          <div className="metric">
            <span>도로 접면</span>
            <strong>확인 필요</strong>
          </div>
          <div className="metric">
            <span>규제 요약</span>
            <strong>2건</strong>
          </div>
        </div>
        <p>표시된 수치는 서비스 화면 구성을 설명하기 위한 예시입니다.</p>
      </div>
    </div>
  );
}
