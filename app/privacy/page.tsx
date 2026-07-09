import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata = {
  title: "개인정보처리방침 | 땅뷰"
};

export default function PrivacyPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">개인정보처리방침</p>
          <h1>개인정보 처리 기준은 출시 전 확정합니다</h1>
          <p>
            현재 페이지는 랜딩페이지 구현을 위한 자리표시자입니다. 실제 서비스 출시 전 수집 항목,
            이용 목적, 보관 기간, 제3자 제공 여부, 파기 절차를 확정해 고지합니다.
          </p>
          <h2>현재 리드 신청 폼 기준</h2>
          <ul>
            <li>수집 예정 항목: 이름 또는 닉네임, 이메일 또는 휴대폰 번호, 관심 지역.</li>
            <li>이용 목적: 출시 알림, 문의 응대, 초기 제공 지역 수요 파악.</li>
            <li>마케팅 수신 동의는 개인정보 수집 동의와 분리합니다.</li>
          </ul>
        </article>
      </main>
      <Footer />
    </div>
  );
}
