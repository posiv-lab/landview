import { faqs } from "@/data/faq";
import { Accordion } from "@/components/ui/Accordion";

export function FaqSection() {
  return (
    <section className="section" id="faq">
      <div className="container split faq-split">
        <div className="section-header">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title">출시 전 자주 확인해야 할 질문</h2>
          <p className="section-description">
            제공 정보의 범위, 출처, 최신성에 대한 질문을 먼저 정리했습니다.
          </p>
        </div>
        <Accordion items={faqs} />
      </div>
    </section>
  );
}
