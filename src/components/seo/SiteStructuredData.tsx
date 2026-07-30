import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_URL,
} from "@/lib/seo";

export function SiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_EN,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icon.svg"),
          contentUrl: absoluteUrl("/icon.svg"),
          width: 512,
          height: 512,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: SITE_NAME_EN,
        description: SITE_DESCRIPTION,
        inLanguage: "ko-KR",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        url: absoluteUrl("/map"),
        name: `${SITE_NAME} 지도`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "주소와 장소를 검색하고 필지 경계 및 토지대장 면적을 확인하는 웹 지도 서비스입니다.",
        inLanguage: "ko-KR",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
      },
    ],
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}
