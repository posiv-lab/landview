import type { Metadata } from "next";
import { ContactDialogProvider } from "@/components/contact/ContactDialog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ddangview.com"),
  title: "땅뷰 | 지역별 토지 실거래가·공시지가·규제 정보를 한 화면에서",
  description:
    "관심 지역의 토지 실거래가, 공시지가, 용도지역, 규제 정보를 땅뷰 한곳에서 확인하세요. 여러 사이트에 흩어진 땅 정보를 지역별로 정리해 보여드립니다.",
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
    title: "땅뷰 | 지역별 토지 정보를 한 화면에서",
    description:
      "실거래가, 공시지가, 용도지역, 규제 정보를 지역별로 정리해 보여주는 토지 정보 조회 서비스.",
    type: "website",
    locale: "ko_KR",
    siteName: "땅뷰"
  }
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
