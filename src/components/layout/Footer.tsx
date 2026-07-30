import Link from "next/link";

import { footerLinks } from "@/data/landingContent";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Link className="brand-mark" href="/">
            <span className="brand-mark__symbol" aria-hidden="true">
              땅
            </span>
            <span>땅뷰</span>
          </Link>
          <p>
            땅뷰는 토지 관련 정보를 정리해 제공하는 조회 서비스입니다. 제공 정보는 참고 자료이며
            중요한 의사결정 전에는 관련 서류, 현장 확인, 전문가 상담 등을 통한 최종 확인이 필요합니다.
          </p>
          <p>
            현재 베타 서비스로 운영 중이며, 운영자 연락은 페이지의 문의하기
            기능을 이용해주세요.
          </p>
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
