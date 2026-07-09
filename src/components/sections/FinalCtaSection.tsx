import { LeadForm } from "@/components/ui/LeadForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function FinalCtaSection() {
  return (
    <section className="section section--tint" id="waitlist">
      <div className="container final-cta">
        <div className="section-header">
          <p className="eyebrow">출시 알림</p>
          <h2 className="section-title">지금 땅뷰에서 관심 지역의 땅 정보를 확인해보세요</h2>
          <p className="section-description">
            초기 제공 지역과 데이터 연동 범위가 확정되면 신청자에게 먼저 안내드리겠습니다.
          </p>
          <div className="hero__trust">
            <Badge variant="neutral">개인정보 동의 분리</Badge>
            <Badge variant="neutral">마케팅 수신 선택</Badge>
          </div>
        </div>
        <Card>
          <LeadForm />
        </Card>
      </div>
    </section>
  );
}
