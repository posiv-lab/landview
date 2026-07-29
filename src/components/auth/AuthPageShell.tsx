import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="site-shell">
      <Header />
      <main className="auth-page">
        <div className="container auth-page__container">
          <div className="auth-page__intro">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="auth-card">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
