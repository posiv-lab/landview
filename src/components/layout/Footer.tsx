import { footerLinks } from "@/data/landingContent";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <a className="brand-mark" href="#">
            <span className="brand-mark__symbol" aria-hidden="true">
              땅
            </span>
            <span>땅뷰</span>
          </a>
          <p>
            땅뷰는 토지 관련 정보를 정리해 제공하는 조회 서비스입니다. 제공 정보는 참고 자료이며
            중요한 의사결정 전에는 관련 서류, 현장 확인, 전문가 상담 등을 통한 최종 확인이 필요합니다.
          </p>
          <p>회사명 및 사업자 정보는 서비스 출시 전 확정 후 표기합니다.</p>
        </div>
        <nav aria-label="푸터 링크" className="footer-links">
          {footerLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
