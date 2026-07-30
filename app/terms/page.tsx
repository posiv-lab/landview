import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "이용약관",
  description:
    "땅뷰 토지 정보 조회 서비스의 이용 범위와 사용자 유의사항을 확인하세요.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">이용약관</p>
          <h1>땅뷰 서비스 이용약관</h1>
          <p>시행일: 2026년 7월 30일</p>
          <p>
            이 약관은 땅뷰가 제공하는 지도 기반 토지 정보 조회, 회원 계정,
            사용자 후기와 문의 기능의 이용 기준을 설명합니다.
          </p>

          <h2>서비스의 범위</h2>
          <ul>
            <li>카카오맵을 이용한 지도·장소 검색.</li>
            <li>VWorld 기반 필지 경계와 토지대장 속성정보 조회.</li>
            <li>회원가입, 로그인, 계정 관리와 사용자 후기.</li>
            <li>서비스 이용·데이터·제휴 관련 문의 접수.</li>
          </ul>

          <h2>회원 계정</h2>
          <p>
            회원은 정확한 이메일을 사용하고 자신의 로그인 정보를 안전하게
            관리해야 합니다. 타인의 정보 도용, 비정상적인 자동 요청, 서비스
            운영 방해가 확인되면 계정 또는 이용이 제한될 수 있습니다.
          </p>

          <h2>사용자 후기</h2>
          <p>
            후기는 로그인한 회원만 작성할 수 있습니다. 불법 정보, 타인의
            권리를 침해하는 내용, 개인정보 노출, 반복 광고 또는 서비스와
            무관한 게시물은 노출이 제한될 수 있습니다. 작성자는 계정 화면을
            통해 자신의 후기를 수정하거나 삭제할 수 있습니다.
          </p>

          <h2>토지 정보 이용</h2>
          <p>
            땅뷰가 표시하는 지도와 공공데이터는 참고 자료이며 원천 데이터의
            기준 시점, 갱신 주기 또는 오류에 따라 실제와 다를 수 있습니다.
            계약·투자·담보 평가·세무·법률 판단 전에는 공식 문서, 현장 및
            관련 전문가를 통해 최종 확인해야 합니다.
          </p>

          <h2>변경과 문의</h2>
          <p>
            기능 또는 외부 데이터 제공 조건에 따라 서비스 일부가 변경되거나
            일시 중단될 수 있습니다. 약관의 중요한 변경은 이 페이지에
            시행일과 함께 고지합니다. 이용 관련 요청은 사이트의 문의하기
            기능으로 접수해주세요.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
