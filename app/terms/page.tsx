import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata = {
  title: "이용약관 | 땅뷰"
};

export default function TermsPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">이용약관</p>
          <h1>서비스 이용약관은 출시 범위 확정 후 게시합니다</h1>
          <p>
            땅뷰는 토지 관련 정보를 정리해 보여주는 조회 서비스로 준비 중입니다. 실제 서비스 제공
            지역, 데이터 연동 범위, 회원 기능, 저장 기능이 확정되면 이용약관을 별도로 고지합니다.
          </p>
          <h2>약관 작성 시 포함할 항목</h2>
          <ul>
            <li>서비스 제공 범위와 제한.</li>
            <li>정보 이용 시 사용자의 최종 확인 책임.</li>
            <li>계정, 관심 지역 저장, 알림 기능의 이용 조건.</li>
            <li>서비스 변경, 중단, 문의 처리 기준.</li>
          </ul>
        </article>
      </main>
      <Footer />
    </div>
  );
}
