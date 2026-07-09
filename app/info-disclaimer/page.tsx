import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata = {
  title: "정보 이용 유의사항 | 땅뷰"
};

export default function InfoDisclaimerPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">정보 이용 유의사항</p>
          <h1>땅뷰의 정보는 참고 자료입니다</h1>
          <p>
            땅뷰는 공공 데이터 등을 기반으로 토지 관련 정보를 정리해 제공하는 조회 서비스입니다.
            제공되는 정보는 참고 자료이며, 데이터별 갱신 주기와 기준 시점에 따라 실제와 차이가 있을
            수 있습니다.
          </p>
          <h2>중요한 의사결정 전 확인할 사항</h2>
          <ul>
            <li>토지대장, 등기사항증명서, 토지이용계획확인서 등 관련 공부서류 확인.</li>
            <li>현장 접근성, 도로 접면, 실제 이용 현황 확인.</li>
            <li>필요 시 공인중개사, 세무사, 법무사 등 전문가 상담.</li>
          </ul>
        </article>
      </main>
      <Footer />
    </div>
  );
}
