import { useCases } from "@/data/landingContent";
import { Card } from "@/components/ui/Card";

export function UseCaseSection() {
  return (
    <section className="section section--subtle" id="use-cases">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">활용 사례</p>
          <h2 className="section-title">사용자 상황에 맞게 필요한 정보를 빠르게 찾습니다</h2>
          <p className="section-description">
            토지 소유주부터 업무용 조회 사용자까지, 목적에 따라 확인해야 할 항목을 구체적으로
            연결합니다.
          </p>
        </div>
        <div className="grid grid--4">
          {useCases.map((useCase) => (
            <Card className="use-case-card" key={useCase.persona}>
              <h3>{useCase.persona}</h3>
              <p>{useCase.situation}</p>
              <dl>
                <div>
                  <dt>필요 정보</dt>
                  <dd>{useCase.needs}</dd>
                </div>
                <div>
                  <dt>땅뷰 활용</dt>
                  <dd>{useCase.value}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
