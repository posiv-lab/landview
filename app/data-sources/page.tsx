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
  {
    name: "국토교통부 공공주택지구 공간정보",
    purpose:
      "서울·경기·인천 LSMD_CONT_UD620 파일의 공공주택지구와 지정된 도심 공공주택 복합지구 경계, 구역명, 고시일, 면적 확인",
    link: "https://www.vworld.kr/",
  },
  {
    name: "국토교통부 VWorld 도시계획 공간정보",
    purpose:
      "서울·경기·인천의 정비·재개발·재건축, 도시개발, 택지개발 관련 구역 경계 확인",
    link: "https://www.vworld.kr/",
  },
  {
    name: "인천광역시 도시 및 주거환경 정비사업 추진현황",
    purpose:
      "인천 일반 정비사업 144건의 구역명, 위치, 면적, 사업유형과 추진단계 확인",
    link: "https://www.data.go.kr/data/15055212/fileData.do",
  },
  {
    name: "인천광역시 소규모주택정비 추진현황",
    purpose:
      "인천 소규모주택정비 111건의 추진단계, 인가·착공일과 조합원·소유자 수 확인",
    link: "https://www.data.go.kr/data/15072776/fileData.do",
  },
  {
    name: "서울특별시 도시정비사업 통계 OA-22856",
    purpose:
      "서울 정비사업 472건의 사업유형, 추진단계, 인허가일과 기존·계획 세대수 확인",
    link: "https://data.seoul.go.kr/dataList/OA-22856/S/1/datasetView.do",
  },
  {
    name: "서울특별시 신속통합기획 추진현황",
    purpose:
      "2026년 6월 기준 대상지 309개와 추진단계 집계를 공식 원문 링크로 확인",
    link: "https://news.seoul.go.kr/citybuild/plan-progress",
  },
  {
    name: "서울특별시 모아타운 추진현황",
    purpose:
      "2026년 3월 말 기준 관리지역 132개와 세부 추진현황을 공식 원문 링크로 확인",
    link: "https://news.seoul.go.kr/citybuild/moa-housing-town/policy/status",
  },
  {
    name: "국토교통부 VWorld 주소검색",
    purpose:
      "서울·인천 정비사업 원본 위치를 지도에서 탐색할 수 있도록 대표 좌표 확인",
    link: "https://www.vworld.kr/",
  },
];

const plannedSources = [
  "국토교통부 부동산 실거래가 공개 데이터",
  "토지이용규제정보 및 용도지역·지구 정보",
  "온비드 공매 정보",
  "법원경매 등 이용 조건을 확인한 경매 정보",
  "서울 신속통합기획·모아타운 상세 위치(형식 변경 허락 또는 별도 개방 데이터 확보 후)",
  "국토교통부·LH·SH·GH·iH 도심 공공주택 복합사업",
  "공공재개발·공공재건축 및 재정비촉진사업",
];

const officialReferenceSources = [
  {
    name: "서울플랜+ 도시계획사업 공간정보 OA-22712",
    purpose: "신속통합기획·모아타운을 포함한 원본 공간자료 확인",
    link: "https://data.seoul.go.kr/dataList/OA-22712/F/1/datasetView.do",
  },
  {
    name: "경기도 정비사업 온누리시스템",
    purpose: "경기도 시·군별 정비사업 공식 현황 교차확인",
    link: "https://www.gg.go.kr/onnuri/",
  },
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
              공공주택지구는 2026년 7월 원천 파일을 웹용으로 변환한
              자료이며, 새 공식 파일을 반영할 때 함께 갱신됩니다.
            </li>
            <li>
              정비·도시개발·택지개발 구역은 현재 지도 영역을 기준으로
              VWorld 도시계획 공간정보에서 조회하며 최대 10분 캐시됩니다.
            </li>
            <li>
              인천 정비사업 추진현황은 일반 정비사업 2026년 5월 31일,
              소규모주택정비 2026년 4월 27일 기준 공식 파일을 반영했습니다.
              전체 255건 중 공식 위치를 주소 좌표로 확인한 180건을 지도에
              표시하며, 경계와 구역명이 유일하게 일치할 때 추진현황을 함께
              표시합니다.
            </li>
            <li>
              서울 정비사업 추진현황은 2026년 3월 31일 기준 공식 엑셀
              472건을 반영했습니다. 이 중 공식 주소를 확인한 414건을 대표
              위치로 지도에 표시하며, 경계가 아닌 탐색용 지점입니다.
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

          <h2>공식 교차확인 창구</h2>
          <ul>
            {officialReferenceSources.map((source) => (
              <li key={source.name}>
                <a href={source.link} rel="noreferrer" target="_blank">
                  {source.name}
                </a>
                : {source.purpose}
              </li>
            ))}
          </ul>

          <h2>비상업 이용과 변경금지 자료</h2>
          <p>
            땅뷰는 현재 무료·비상업 공개를 전제로 운영합니다. 다만 공공누리
            제4유형은 비상업 이용만 허용하는 동시에 형식 변경과 2차적 저작물
            작성을 금지합니다. 따라서 신속통합기획·모아타운 원문은 출처 링크로
            연결하고, SHP를 GeoJSON으로 변환하는 등 지도용 가공은 별도 허락을
            받기 전까지 진행하지 않습니다.
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
