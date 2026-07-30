import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { createPublicMetadata } from "@/lib/seo";

const description =
  "땅뷰가 현재 연결한 지도·필지·토지대장 데이터의 출처와 제공 범위, 갱신 기준 및 이용 시 유의사항을 확인하세요.";

export const metadata = createPublicMetadata({
  title: "데이터 출처와 제공 범위",
  description,
  path: "/data-sources",
});

const connectedSources = [
  {
    name: "카카오맵 JavaScript SDK",
    purpose: "기본 지도, 장소·주소 검색, 지도 좌표 탐색",
    link: "https://apis.map.kakao.com/",
  },
  {
    name: "VWorld 연속지적도",
    purpose: "지도 영역 내 필지 경계와 PNU 확인",
    link: "https://www.vworld.kr/",
  },
  {
    name: "VWorld 토지·임야대장 속성정보",
    purpose: "선택 필지의 지목, 대장 구분, 대장 면적, 갱신일 확인",
    link: "https://www.vworld.kr/",
  },
];

const plannedSources = [
  "국토교통부 부동산 실거래가 공개 데이터",
  "토지이용규제정보 및 용도지역·지구 정보",
  "온비드 공매 정보",
  "법원경매 등 이용 조건을 확인한 경매 정보",
];

export default function DataSourcesPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="legal-page">
        <article className="container">
          <p className="eyebrow">DATA SOURCES</p>
          <h1>데이터 출처와 제공 범위</h1>
          <p>
            땅뷰는 외부 지도와 공공데이터를 사용자가 확인하기 쉬운 형태로
            정리합니다. 아래에는 현재 서비스에 실제 연결된 정보와 향후
            연결을 검토 중인 정보를 구분해 표시합니다.
          </p>

          <h2>현재 연결된 데이터</h2>
          <ul>
            {connectedSources.map((source) => (
              <li key={source.name}>
                <a href={source.link} rel="noreferrer" target="_blank">
                  {source.name}
                </a>
                : {source.purpose}
              </li>
            ))}
          </ul>

          <h2>갱신과 표시 기준</h2>
          <ul>
            <li>
              지도와 필지 정보는 사용자가 조회할 때 각 제공 API의 응답을
              기준으로 표시합니다.
            </li>
            <li>
              필지 경계는 최대 5분, 토지대장 속성은 최대 24시간 캐시될 수
              있습니다.
            </li>
            <li>
              원천 기관의 갱신 시점, 점검 또는 장애에 따라 조회 결과가
              늦거나 제공되지 않을 수 있습니다.
            </li>
          </ul>

          <h2>연결 검토 중인 데이터</h2>
          <ul>
            {plannedSources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
          <p>
            위 항목은 현재 제공 중인 기능이 아니라 구현·이용 조건을 검토
            중인 범위입니다. 실제 연결 시 출처, 기준일, 갱신 주기와 제공
            한계를 이 페이지에 추가합니다.
          </p>

          <h2>정보 이용 시 유의사항</h2>
          <p>
            땅뷰의 정보는 참고 자료입니다. 계약, 담보 평가, 세무·법률 판단
            등 중요한 의사결정 전에는 토지대장, 등기사항증명서,
            토지이용계획확인서 등 공식 문서와 현장을 다시 확인해주세요.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
