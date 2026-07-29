import { Map } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/data/landingContent";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ContactButton } from "@/components/contact/ContactDialog";
import { getCurrentUser } from "@/lib/auth/session";

export async function Header() {
  const user = await getCurrentUser();

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
            <a href={`/${link.href}`} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <Button href="/map" variant="secondary">
            지도 열기
          </Button>
          <ContactButton variant="secondary">문의하기</ContactButton>
          {user ? (
            <>
              <Button href="/account">
                {user.nickname}님
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost">
                로그인
              </Button>
              <Button href="/signup">회원가입</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
