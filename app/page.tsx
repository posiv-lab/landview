import type { Metadata } from "next";
import { KakaoMapWorkspace } from "@/components/map/KakaoMapWorkspace";
import { SiteStructuredData } from "@/components/seo/SiteStructuredData";
import { getCurrentUser } from "@/lib/auth/session";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "지도에서 토지 정보 찾기",
  description:
    "주소나 장소를 검색하고 지도에서 필지 경계, 지목, 토지대장 면적과 정비사업·개발계획 구역을 확인하세요.",
  path: "/",
});

export default async function Home() {
  const vworldConfigured = Boolean(
    process.env.VWORLD_API_KEY?.trim() && process.env.VWORLD_DOMAIN?.trim()
  );
  const user = await getCurrentUser();

  return (
    <>
      <SiteStructuredData />
      <KakaoMapWorkspace
        appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim() ?? ""}
        currentUser={user ? { nickname: user.nickname } : null}
        vworldConfigured={vworldConfigured}
      />
    </>
  );
}
