import { permanentRedirect } from "next/navigation";

// 지도는 이제 루트 경로에서 제공한다. 기존 /map 링크와 색인은 루트로 넘긴다.
export default function MapPage() {
  permanentRedirect("/");
}
