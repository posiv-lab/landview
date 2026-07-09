export const navLinks = [
  { href: "#features", label: "주요 기능" },
  { href: "#data", label: "데이터 출처" },
  { href: "#use-cases", label: "활용 사례" },
  { href: "#faq", label: "FAQ" }
];

export const problemCards = [
  {
    title: "정보가 여러 사이트에 흩어져 있습니다",
    description:
      "실거래가, 공시지가, 토지이용계획을 각각 다른 화면에서 찾아야 합니다.",
    icon: "route"
  },
  {
    title: "토지 용어가 어렵습니다",
    description:
      "용도지역, 지목, 행위 제한 같은 행정 용어를 바로 이해하기 어렵습니다.",
    icon: "book"
  },
  {
    title: "주변과 비교하기 어렵습니다",
    description:
      "내 땅 또는 관심 필지가 주변 거래와 어떤 차이가 있는지 한눈에 보기 어렵습니다.",
    icon: "compare"
  },
  {
    title: "공공 정보는 찾기 어렵습니다",
    description:
      "정보는 공개되어 있어도 검색 흐름과 화면 구성이 처음 사용자에게 친절하지 않습니다.",
    icon: "search"
  }
];

export const features = [
  {
    title: "지역별 토지 탐색",
    description:
      "시·군·구에서 읍·면·동 단위까지 내려가며 관심 지역의 필지 정보를 지도 기반으로 살펴봅니다.",
    icon: "map"
  },
  {
    title: "실거래가 조회",
    description:
      "주변 토지의 실제 거래 내역과 단가를 같은 화면에서 비교할 수 있게 정리합니다.",
    icon: "receipt"
  },
  {
    title: "공시지가와 가격 흐름",
    description:
      "연도별 공시지가 변화를 함께 보여주어 기준 가격의 흐름을 확인할 수 있습니다.",
    icon: "chart"
  },
  {
    title: "필지 기본 정보 요약",
    description:
      "용도지역, 지목, 면적, 도로 접면 등 기본 정보를 쉬운 문장과 데이터 패널로 요약합니다.",
    icon: "file"
  },
  {
    title: "토지이용계획·규제 확인",
    description:
      "개발 제한, 행위 제한 등 확인해야 할 규제 정보를 체크리스트 형태로 보여줍니다.",
    icon: "shield"
  },
  {
    title: "관심 지역 저장과 비교",
    description:
      "관심 필지와 주변 지역을 저장해 나중에 다시 보고 비교할 수 있는 흐름을 제공합니다.",
    icon: "bookmark"
  }
];

export const trustItems = [
  {
    title: "공공 데이터 기반",
    description:
      "실거래가, 공시지가, 토지이용계획 등 공개된 데이터를 기반으로 정보를 정리합니다."
  },
  {
    title: "출처와 기준 시점 표시",
    description:
      "각 정보의 출처와 기준 시점을 함께 보여주어 사용자가 최신성의 한계를 판단할 수 있게 합니다."
  },
  {
    title: "최종 확인 필요 고지",
    description:
      "제공 정보는 참고 자료이며, 중요한 의사결정 전에는 공부서류와 현장 확인이 필요함을 안내합니다."
  }
];

export const checklist = [
  { label: "용도지역과 행위 제한", status: "확인 완료", variant: "success" },
  { label: "도로 접면과 접근성", status: "확인 필요", variant: "warning" },
  { label: "주변 실거래 단가", status: "비교 필요", variant: "info" },
  { label: "지목과 실제 이용 현황", status: "확인 필요", variant: "warning" },
  { label: "공시지가 기준 시점", status: "확인 완료", variant: "success" }
] as const;

export const flowSteps = [
  {
    title: "관심 지역을 검색합니다",
    description:
      "지역명 또는 행정구역 단위로 검색하고, 지도에서 확인할 범위를 선택합니다."
  },
  {
    title: "정보를 한 화면에서 봅니다",
    description:
      "필지 정보, 실거래가, 공시지가, 규제 정보를 한 화면에서 함께 확인합니다."
  },
  {
    title: "저장하고 주변과 비교합니다",
    description:
      "관심 필지를 저장하고 주변 거래·공시지가 흐름과 비교합니다."
  }
];

export const useCases = [
  {
    persona: "토지 소유주",
    situation: "소유하거나 상속받은 토지의 현재 정보를 확인하고 싶을 때",
    needs: "공시지가 변화, 주변 실거래, 용도지역",
    value: "내 땅의 기준 정보와 주변 거래 흐름을 한 화면에서 확인합니다."
  },
  {
    persona: "매수·매도 검토자",
    situation: "관심 지역 토지의 가격 흐름을 비교하고 싶을 때",
    needs: "주변 실거래 단가, 면적, 지목, 접근성",
    value: "여러 필지를 같은 기준으로 비교해 검토 시간을 줄입니다."
  },
  {
    persona: "귀농·전원주택 준비자",
    situation: "후보지가 실제 목적에 맞는지 미리 살펴보고 싶을 때",
    needs: "용도지역, 행위 제한, 도로 접면",
    value: "후보지별 확인 항목을 체크리스트처럼 정리합니다."
  },
  {
    persona: "중개사·전문가",
    situation: "여러 필지 정보를 반복 조회하고 상담 자료로 정리할 때",
    needs: "필지 요약, 거래 비교, 출처와 기준 시점",
    value: "반복 확인하는 정보를 빠르게 찾아 상담 준비에 활용합니다."
  }
];

export const comparisonRows = [
  {
    area: "예시 A 필지",
    size: "1,286㎡",
    price: "㎡당 182,000원",
    zoning: "계획관리지역"
  },
  {
    area: "주변 거래 1",
    size: "1,104㎡",
    price: "㎡당 176,000원",
    zoning: "계획관리지역"
  },
  {
    area: "주변 거래 2",
    size: "940㎡",
    price: "㎡당 193,000원",
    zoning: "생산관리지역"
  }
];

export const footerLinks = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/info-disclaimer", label: "정보 이용 유의사항" },
  { href: "mailto:hello@ddangview.com", label: "문의" }
];
