import type { Metadata } from "next";
import { KakaoMapWorkspace } from "@/components/map/KakaoMapWorkspace";

export const metadata: Metadata = {
  title: "지도에서 토지정보 찾기 | 땅뷰",
  description: "주소나 장소를 검색하고 지도에서 관심 지역의 토지정보를 확인하세요."
};

export default function MapPage() {
  const vworldConfigured = Boolean(
    process.env.VWORLD_API_KEY?.trim() && process.env.VWORLD_DOMAIN?.trim()
  );

  return (
    <KakaoMapWorkspace
      appKey={process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim() ?? ""}
      vworldConfigured={vworldConfigured}
    />
  );
}
