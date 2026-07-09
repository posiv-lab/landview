import { ArrowDown, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/ui/SearchBox";
import { MapMockup } from "@/components/mockups/MapMockup";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__trust">
            <Badge variant="brand">공공 데이터 기반</Badge>
            <Badge variant="neutral">지역별 토지 정보 조회</Badge>
          </div>
          <div>
            <h1>우리 동네 땅 정보, 한 화면에서 확인하세요</h1>
            <p className="hero__lead">
              실거래가부터 공시지가, 용도지역, 규제 정보까지 지역별로 정리해 보여드립니다.
              여러 사이트를 오가지 않고 관심 지역의 토지 정보를 확인하세요.
            </p>
          </div>
          <SearchBox />
          <div className="hero__actions">
            <Button href="#features" size="lg" variant="secondary">
              주요 기능 살펴보기
              <ArrowDown aria-hidden="true" size={18} />
            </Button>
            <Button href="#waitlist" size="lg" variant="subtle">
              출시 알림 받기
            </Button>
          </div>
          <div className="trust-strip">
            <span>
              <Database aria-hidden="true" size={16} />
              출처와 기준 시점 표시
            </span>
            <span>
              <ShieldCheck aria-hidden="true" size={16} />
              투자 권유가 아닌 정보 조회
            </span>
          </div>
        </div>
        <MapMockup />
      </div>
    </section>
  );
}
