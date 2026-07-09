import { flowSteps } from "@/data/landingContent";
import { Card } from "@/components/ui/Card";

export function FlowSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">사용 흐름</p>
          <h2 className="section-title">검색하고, 확인하고, 비교합니다</h2>
          <p className="section-description">
            처음 사용하는 사람도 이해할 수 있도록 조사 과정을 세 단계로 단순화합니다.
          </p>
        </div>
        <div className="timeline">
          {flowSteps.map((step, index) => (
            <Card className="feature-card" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
