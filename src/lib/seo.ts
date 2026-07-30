import type { Metadata } from "next";

export const SITE_NAME = "땅뷰";
export const SITE_NAME_EN = "landview";
export const SITE_URL = "https://landview.vercel.app";
export const SITE_DESCRIPTION =
  "관심 지역의 필지 경계와 토지대장 면적을 지도에서 확인하고, 토지 관련 공공 정보를 한곳에서 살펴보세요.";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createPublicMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      url: path,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} 토지 정보 지도 서비스`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export function createPrivateMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}
