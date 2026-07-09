import { Clock3, Database, FileCheck2 } from "lucide-react";
import { trustItems } from "@/data/landingContent";
import { Card } from "@/components/ui/Card";

const icons = [Database, Clock3, FileCheck2];

export function DataTrustSection() {
  return (
    <section className="section" id="data">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">데이터 신뢰</p>
          <h2 className="section-title">출처와 기준 시점을 숨기지 않는 정보 서비스</h2>
          <p className="section-description">
            땅뷰는 공공 데이터를 보기 쉽게 정리하는 도구입니다. 데이터별 갱신 주기와 최신성의 한계를
            명확히 안내합니다.
          </p>
        </div>
        <div className="grid grid--3">
          {trustItems.map((item, index) => {
            const Icon = icons[index];

            return (
              <Card className="feature-card" key={item.title} tone={index === 0 ? "tint" : "default"}>
                <span className="feature-card__icon">
                  <Icon aria-hidden="true" size={21} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Card>
            );
          })}
        </div>
        <div className="notice-box data-notice">
          <h3>정보 이용 유의사항</h3>
          <p>
            제공 정보는 참고 자료이며 데이터별 기준 시점에 따라 실제와 차이가 있을 수 있습니다.
            중요한 의사결정 전에는 관련 공부서류, 현장 확인, 전문가 상담 등을 통해 최종 확인이
            필요합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
