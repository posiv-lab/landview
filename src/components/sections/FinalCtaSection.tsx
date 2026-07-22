import { ContactForm } from "@/components/contact/ContactForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function FinalCtaSection() {
  return (
    <section className="section section--tint" id="contact">
      <div className="container final-cta">
        <div className="section-header">
          <p className="eyebrow">서비스 문의</p>
          <h2 className="section-title">궁금한 지역이나 필요한 기능을 알려주세요</h2>
          <p className="section-description">
            토지 데이터, 제공 지역, 서비스 기능에 관한 문의를 남겨주시면 확인 후 연락드리겠습니다.
          </p>
          <div className="hero__trust">
            <Badge variant="neutral">개인정보 동의 분리</Badge>
            <Badge variant="neutral">마케팅 수신 선택</Badge>
          </div>
        </div>
        <Card>
          <ContactForm source="inline" />
        </Card>
      </div>
    </section>
  );
}
