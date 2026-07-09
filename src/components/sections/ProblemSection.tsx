import { BookOpen, GitCompare, Route, Search } from "lucide-react";
import { problemCards } from "@/data/landingContent";
import { Card } from "@/components/ui/Card";

const icons = {
  route: Route,
  book: BookOpen,
  compare: GitCompare,
  search: Search
};

export function ProblemSection() {
  return (
    <section className="section section--subtle">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">문제 제기</p>
          <h2 className="section-title">토지 정보 확인은 아직도 여러 화면을 오가야 합니다</h2>
          <p className="section-description">
            토지는 아파트처럼 한 화면에서 시세와 규제를 함께 보기 어렵습니다. 땅뷰는 흩어진 정보를
            사용자가 읽기 쉬운 흐름으로 정리합니다.
          </p>
        </div>
        <div className="grid grid--4">
          {problemCards.map((problem) => {
            const Icon = icons[problem.icon as keyof typeof icons];

            return (
              <Card className="feature-card" key={problem.title}>
                <span className="feature-card__icon">
                  <Icon aria-hidden="true" size={21} />
                </span>
                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
