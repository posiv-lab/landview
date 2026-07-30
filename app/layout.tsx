import type { Metadata } from "next";
import { ContactDialogProvider } from "@/components/contact/ContactDialog";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "땅뷰 | 필지 경계·토지대장 면적을 지도에서 한눈에",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "real estate",
  keywords: [
    "토지 실거래가 조회",
    "땅값 조회",
    "토지 시세",
    "공시지가 조회",
    "지역별 토지 가격",
    "토지이용계획 확인",
    "임야 시세",
    "농지 가격"
  ],
  openGraph: {
    title: "땅뷰 | 필지 경계·토지대장 면적을 지도에서 한눈에",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "땅뷰 토지 정보 지도 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "땅뷰 | 필지 경계·토지대장 면적을 지도에서 한눈에",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined,
    other: process.env.NAVER_SITE_VERIFICATION?.trim()
      ? {
          "naver-site-verification":
            process.env.NAVER_SITE_VERIFICATION.trim(),
        }
      : undefined,
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="has-sticky-cta">
        <ContactDialogProvider>{children}</ContactDialogProvider>
      </body>
    </html>
  );
}
