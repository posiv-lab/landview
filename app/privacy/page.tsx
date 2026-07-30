import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "개인정보처리방침",
  description:
    "땅뷰 회원 서비스와 문의 기능에서 처리하는 개인정보의 기준을 확인하세요.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">개인정보처리방침</p>
          <h1>땅뷰 개인정보처리방침</h1>
          <p>시행일: 2026년 7월 30일</p>
          <p>
            땅뷰는 회원 서비스, 사용자 후기와 문의 응대를 제공하는 데 필요한
            범위에서 개인정보를 처리합니다.
          </p>

          <h2>처리하는 정보</h2>
          <ul>
            <li>
              회원가입: 이메일, 닉네임, 단방향 해시된 비밀번호, 약관·개인정보 동의
              시각, 이메일 인증 및 최근 로그인 시각.
            </li>
            <li>
              로그인 유지와 보안: 세션 식별자의 해시, IP 주소와 브라우저
              정보의 해시, 세션 생성·만료·최근 사용 시각.
            </li>
            <li>
              후기: 별점, 제목, 내용, 공개용 닉네임, 작성·수정 시각.
            </li>
            <li>
              문의: 이름 또는 닉네임, 이메일 또는 휴대폰 번호, 문의 유형,
              관심 지역, 문의 내용과 선택적 안내 수신 동의 여부.
            </li>
          </ul>

          <h2>이용 목적</h2>
          <ul>
            <li>회원 식별, 이메일 인증, 로그인과 계정 보안.</li>
            <li>사용자 후기의 작성·수정·삭제 및 공개.</li>
            <li>문의 확인과 답변, 선택적으로 동의한 서비스 안내.</li>
            <li>오류 대응, 비정상적인 요청 방지와 서비스 안정성 확보.</li>
          </ul>

          <h2>처리 방식과 보관</h2>
          <ul>
            <li>
              회원·세션·후기 정보는 서버에서 Supabase 데이터베이스로
              처리하며 브라우저에서 데이터베이스에 직접 접속하지 않습니다.
            </li>
            <li>
              문의 내용은 Resend를 통해 운영 수신 이메일로 전달되며, 현재
              땅뷰 데이터베이스에는 별도로 저장하지 않습니다.
            </li>
            <li>
              회원 정보는 계정 삭제 요청 처리 시까지, 후기는 사용자가
              삭제할 때까지 보관합니다. 법령상 별도 보관 의무가 있으면 해당
              기간을 따릅니다.
            </li>
            <li>
              로그인 세션은 기본 14일 후 만료되며 로그아웃 또는 비밀번호
              변경 시 종료될 수 있습니다.
            </li>
          </ul>

          <h2>이용자의 권리와 문의</h2>
          <p>
            자신의 후기는 계정 화면에서 수정하거나 삭제할 수 있습니다.
            회원 정보 열람·정정·삭제, 안내 수신 철회 등 다른 요청은 사이트의
            문의하기 기능으로 접수해주세요. 운영 주체의 법적 상호·주소·책임자
            정보가 확정되면 이 방침에 추가하고 변경 내용을 고지합니다.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
