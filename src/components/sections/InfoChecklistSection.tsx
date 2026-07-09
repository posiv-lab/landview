import { checklist } from "@/data/landingContent";
import { CompareTableMockup } from "@/components/mockups/CompareTableMockup";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function InfoChecklistSection() {
  return (
    <section className="section section--tint">
      <div className="container split">
        <div>
          <div className="section-header">
            <p className="eyebrow">정보 체크</p>
            <h2 className="section-title">토지를 볼 때 놓치기 쉬운 항목을 차분하게 확인합니다</h2>
            <p className="section-description">
              빨간 경고보다 필요한 확인 항목을 단계형 상태로 보여줍니다. 불안을 키우기보다 꼼꼼한
              검토를 돕는 방식입니다.
            </p>
          </div>
          <Card className="checklist-card">
            {checklist.map((item) => (
              <div className="check-row" key={item.label}>
                <strong>{item.label}</strong>
                <Badge variant={item.variant as BadgeVariant}>{item.status}</Badge>
              </div>
            ))}
          </Card>
        </div>
        <CompareTableMockup />
      </div>
    </section>
  );
}
