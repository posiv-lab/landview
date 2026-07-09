import { CheckCircle2 } from "lucide-react";
import { ParcelPanelMockup } from "@/components/mockups/ParcelPanelMockup";
import { Badge } from "@/components/ui/Badge";

const solutionPoints = [
  "지역 검색과 지도 선택으로 관심 범위를 빠르게 좁힙니다.",
  "필지 기본 정보, 실거래가, 공시지가, 규제 정보를 같은 화면에서 봅니다.",
  "어려운 토지 용어는 짧은 설명과 체크 상태로 정리합니다."
];

export function SolutionSection() {
  return (
    <section className="section">
      <div className="container split">
        <div className="section-header">
          <p className="eyebrow">솔루션</p>
          <h2 className="section-title">지도와 데이터 패널을 함께 보는 토지 정보 조회 흐름</h2>
          <p className="section-description">
            땅뷰는 특정 토지를 추천하지 않습니다. 사용자가 관심 지역의 공개 정보를 빠르게 찾고,
            같은 기준으로 비교할 수 있도록 돕습니다.
          </p>
          <div className="point-list">
            {solutionPoints.map((point) => (
              <div className="point-list__item" key={point}>
                <CheckCircle2 aria-hidden="true" color="var(--success-strong)" size={20} />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <Badge variant="neutral">매물 호가 정보는 확보 확정 후 별도 검토</Badge>
        </div>
        <ParcelPanelMockup />
      </div>
    </section>
  );
}
