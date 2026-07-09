import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function ParcelPanelMockup() {
  return (
    <div className="panel-stack">
      <Card className="parcel-panel" tone="tint">
        <div className="parcel-panel__header">
          <div>
            <p className="eyebrow">필지 정보 예시</p>
            <h3>경기 양평군 서종면 예시 필지</h3>
            <p className="section-description">지목, 면적, 용도지역, 접도 정보를 한 화면에서 확인합니다.</p>
          </div>
          <Badge variant="brand">예시</Badge>
        </div>
        <div className="metric-grid">
          <div className="metric">
            <span>지목</span>
            <strong>답</strong>
          </div>
          <div className="metric">
            <span>면적</span>
            <strong>1,286㎡</strong>
          </div>
          <div className="metric">
            <span>용도지역</span>
            <strong>계획관리</strong>
          </div>
          <div className="metric">
            <span>기준 시점</span>
            <strong>표기 예정</strong>
          </div>
        </div>
      </Card>
      <Card className="parcel-panel">
        <div className="parcel-panel__header">
          <div>
            <p className="eyebrow">가격 흐름 예시</p>
            <h3>공시지가와 주변 실거래 비교</h3>
          </div>
          <Badge variant="info">참고용</Badge>
        </div>
        <div className="price-bars" aria-label="예시 가격 흐름">
          <span style={{ width: "54%" }}>2022</span>
          <span style={{ width: "68%" }}>2023</span>
          <span style={{ width: "76%" }}>2024</span>
        </div>
        <p className="mock-note">
          실제 서비스에서는 데이터별 기준 시점과 출처를 함께 표시합니다.
        </p>
      </Card>
    </div>
  );
}
