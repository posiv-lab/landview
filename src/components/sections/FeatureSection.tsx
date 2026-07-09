import {
  BarChart3,
  Bookmark,
  FileText,
  MapPinned,
  ReceiptText,
  ShieldCheck
} from "lucide-react";
import { features } from "@/data/landingContent";
import { Card } from "@/components/ui/Card";

const icons = {
  map: MapPinned,
  receipt: ReceiptText,
  chart: BarChart3,
  file: FileText,
  shield: ShieldCheck,
  bookmark: Bookmark
};

export function FeatureSection() {
  return (
    <section className="section section--subtle" id="features">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">주요 기능</p>
          <h2 className="section-title">토지를 볼 때 필요한 정보를 같은 기준으로 정리합니다</h2>
          <p className="section-description">
            지역 탐색, 가격 확인, 필지 요약, 규제 확인을 하나의 조사 흐름으로 연결합니다.
          </p>
        </div>
        <div className="grid grid--3">
          {features.map((feature) => {
            const Icon = icons[feature.icon as keyof typeof icons];

            return (
              <Card className="feature-card" key={feature.title}>
                <span className="feature-card__icon">
                  <Icon aria-hidden="true" size={21} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
