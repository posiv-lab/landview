import { Map } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/data/landingContent";
import { Button } from "@/components/ui/Button";
import { ContactButton } from "@/components/contact/ContactDialog";

export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link aria-label="땅뷰 홈" className="brand-mark" href="/">
          <span className="brand-mark__symbol">
            <Map aria-hidden="true" size={19} />
          </span>
          <span>땅뷰</span>
        </Link>
        <nav aria-label="주요 섹션" className="site-nav">
          {navLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <Button href="/map" variant="secondary">
            지도 열기
          </Button>
          <ContactButton>문의하기</ContactButton>
        </div>
      </div>
    </header>
  );
}
