import { Map } from "lucide-react";
import { navLinks } from "@/data/landingContent";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a aria-label="땅뷰 홈" className="brand-mark" href="#">
          <span className="brand-mark__symbol">
            <Map aria-hidden="true" size={19} />
          </span>
          <span>땅뷰</span>
        </a>
        <nav aria-label="주요 섹션" className="site-nav">
          {navLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <Button href="#features" variant="secondary">
            기능 보기
          </Button>
          <Button href="#waitlist">출시 알림</Button>
        </div>
      </div>
    </header>
  );
}
