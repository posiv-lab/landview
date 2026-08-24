"use client";

import Link from "next/link";
import {
  Building2,
  Database,
  Info,
  Layers3,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ContactButton } from "@/components/contact/ContactDialog";
import { Button } from "@/components/ui/Button";

type KakaoMapWorkspaceProps = {
  appKey: string;
  currentUser: { nickname: string } | null;
  vworldConfigured: boolean;
};

type MapStatus = "loading" | "ready" | "error" | "missing-key";
type ParcelStatus =
  | "idle"
  | "loading"
  | "ready"
  | "zoom-in"
  | "not-configured"
  | "error";

type DevelopmentStatus =
  | "idle"
  | "loading"
  | "ready"
  | "zoom-in"
  | "error";

type PlanningCategory = "maintenance" | "urban-development" | "housing-site";

type PlanningStatus =
  | "idle"
  | "loading"
  | "ready"
  | "zoom-in"
  | "not-configured"
  | "error";

type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type ParcelFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    id?: string;
    geometry: PolygonGeometry | MultiPolygonGeometry | null;
    properties?: {
      addr?: unknown;
      bonbun?: unknown;
      bubun?: unknown;
      gosi_month?: unknown;
      gosi_year?: unknown;
      jibun?: unknown;
      jiga?: unknown;
      pnu?: unknown;
    };
  }>;
};

type DevelopmentFeatureCollection = {
  features: Array<{
    geometry: PolygonGeometry | MultiPolygonGeometry | null;
    id?: string;
    properties: DevelopmentProjectDetail;
    type: "Feature";
  }>;
  total: number;
  truncated: boolean;
  type: "FeatureCollection";
};

type DevelopmentProjectDetail = {
  areaSquareMeters: number | null;
  bounds: [number, number, number, number];
  districtCode: string;
  noticeDate: string;
  noticeId: string;
  projectName: string;
  projectType: string;
  regionName: string;
  remark: string;
  sourceBaseDate: string;
  sourceFile: string;
  sourceName: string;
};

type PlanningZoneDetail = {
  areaSquareMeters: number | null;
  category: PlanningCategory;
  classification: string;
  districtCode: string;
  noticeId: string;
  programTags?: string[];
  projectName: string;
  projectType: string;
  regionName: string;
  sourceName: string;
  statusName: string;
};

type MaintenanceProjectDetail = {
  areaSquareMeters: number | null;
  businessStage: string;
  businessStageOrder: number;
  center?: {
    latitude: number;
    longitude: number;
    matchedAddress: string;
    query: string;
    source: string;
  };
  details: {
    architecturalReviewDate?: string;
    associationApprovalDate?: string;
    committeeApprovalDate?: string;
    constructionStartDate?: string;
    districtDesignationDate?: string;
    districtType?: string;
    existingHouseholds?: number | null;
    implementationApprovalDate?: string;
    managementDispositionDate?: string;
    memberCount?: number | null;
    note?: string;
    ownerCount?: number | null;
    plannedHouseholds?: number | null;
    plannedRentalHouseholds?: number | null;
    plannedSaleHouseholds?: number | null;
    publicPrivate?: string;
    relocationEndDate?: string;
    relocationStartDate?: string;
    residentAgreementDate?: string;
  };
  districtName: string;
  id: string;
  location: string;
  matchConfidence?: "exact" | "normalized";
  officialUrl: string;
  programTags?: string[];
  projectName: string;
  projectType: string;
  rawStage: string;
  regionCode: string;
  sourceBaseDate: string;
  sourceDataset: string;
  sourceProvider: string;
};

type MaintenanceProjectCollection = {
  projects: MaintenanceProjectDetail[];
  total: number;
  type: "LandViewMaintenanceProjectCollection";
};

type ProjectZoneCategory =
  | "fast-track"
  | "moa-town"
  | "redevelopment"
  | "reconstruction"
  | "small-scale"
  | "promotion"
  | "residential";

type ProjectZoneDetail = {
  areaSquareMeters: number | null;
  bounds: [number, number, number, number];
  category: ProjectZoneCategory;
  districtCode: string;
  districtName: string;
  noticeDate: string;
  normalizedName: string;
  partCount: number;
  programTags: string[];
  projectName: string;
  projectType: string;
  regionName: string;
  stageName: string;
};

type ProjectZoneCollection = {
  features: Array<{
    geometry: PolygonGeometry | MultiPolygonGeometry | null;
    id: string;
    properties: ProjectZoneDetail;
    type: "Feature";
  }>;
  metadata: {
    sourceBaseDate: string;
    sourceLicense: string;
    sourceName: string;
    sourceUrl: string;
  };
  total: number;
  type: "FeatureCollection";
};

type PolicyStatus = "idle" | "loading" | "ready" | "error" | "zoom-in";

type MaintenanceMatchStatus = "idle" | "loading" | "ready" | "not-found" | "error";

type PlanningFeatureCollection = {
  category: PlanningCategory;
  features: Array<{
    geometry: PolygonGeometry | MultiPolygonGeometry | null;
    id: string;
    properties: PlanningZoneDetail;
    type: "Feature";
  }>;
  total: number;
  truncated: boolean;
  type: "FeatureCollection";
};

type SelectedParcel = {
  address: string;
  areaSquareMeters: number | null;
  bonbun: string;
  bubun: string;
  jibun: string;
  officialPrice: number | null;
  pnu: string;
  referenceMonth: string;
  referenceYear: string;
};

type LandLedger = {
  areaSquareMeters: number;
  landCategory: string;
  lastUpdatedDate: string;
  legalDistrict: string;
  lotNumber: string;
  pnu: string;
  registerType: string;
};

type LandLedgerStatus = "idle" | "loading" | "ready" | "not-found" | "error";

type ParcelPolygonEntry = {
  clickHandler: (event: { latLng: KakaoLatLng }) => void;
  polygon: KakaoPolygon;
};

type DevelopmentPolygonEntry = ParcelPolygonEntry;

type PlanningPolygonEntry = ParcelPolygonEntry;

type MaintenanceMarkerEntry = {
  clickHandler: () => void;
  element: HTMLElement;
  overlay: KakaoCustomOverlay;
};

const DEFAULT_PARCEL_STYLE = {
  strokeWeight: 1,
  strokeColor: "#e4c64d",
  strokeOpacity: 0.72,
  fillColor: "#ffe99a",
  fillOpacity: 0.16
};

const SELECTED_PARCEL_STYLE = {
  strokeWeight: 4,
  strokeColor: "#93250a",
  strokeOpacity: 1,
  fillColor: "#ff540f",
  fillOpacity: 0.38
};

const DEFAULT_DEVELOPMENT_STYLE = {
  strokeWeight: 2,
  strokeColor: "#6d28d9",
  strokeOpacity: 0.9,
  fillColor: "#a78bfa",
  fillOpacity: 0.14
};

const SELECTED_DEVELOPMENT_STYLE = {
  strokeWeight: 4,
  strokeColor: "#4c1d95",
  strokeOpacity: 1,
  fillColor: "#8b5cf6",
  fillOpacity: 0.3
};

const PLANNING_ZONE_STYLES: Record<PlanningCategory, typeof DEFAULT_DEVELOPMENT_STYLE> = {
  maintenance: {
    strokeWeight: 2,
    strokeColor: "#dc2626",
    strokeOpacity: 0.9,
    fillColor: "#f87171",
    fillOpacity: 0.13
  },
  "urban-development": {
    strokeWeight: 2,
    strokeColor: "#0369a1",
    strokeOpacity: 0.9,
    fillColor: "#38bdf8",
    fillOpacity: 0.13
  },
  "housing-site": {
    strokeWeight: 2,
    strokeColor: "#0f766e",
    strokeOpacity: 0.9,
    fillColor: "#2dd4bf",
    fillOpacity: 0.13
  }
};

const SELECTED_PLANNING_STYLE = {
  strokeWeight: 4,
  strokeColor: "#111827",
  strokeOpacity: 1,
  fillColor: "#f59e0b",
  fillOpacity: 0.3
};

// 서울 정비사업 구역 — 사업 갈래별로 색을 나눈다.
const PROJECT_ZONE_STYLES: Record<
  ProjectZoneCategory,
  typeof DEFAULT_DEVELOPMENT_STYLE
> = {
  "fast-track": {
    strokeWeight: 2,
    strokeColor: "#c2410c",
    strokeOpacity: 0.95,
    fillColor: "#fb923c",
    fillOpacity: 0.18
  },
  "moa-town": {
    strokeWeight: 2,
    strokeColor: "#7e22ce",
    strokeOpacity: 0.95,
    fillColor: "#c084fc",
    fillOpacity: 0.18
  },
  redevelopment: {
    strokeWeight: 2,
    strokeColor: "#b91c1c",
    strokeOpacity: 0.95,
    fillColor: "#f87171",
    fillOpacity: 0.18
  },
  reconstruction: {
    strokeWeight: 2,
    strokeColor: "#1d4ed8",
    strokeOpacity: 0.95,
    fillColor: "#60a5fa",
    fillOpacity: 0.18
  },
  "small-scale": {
    strokeWeight: 2,
    strokeColor: "#047857",
    strokeOpacity: 0.9,
    fillColor: "#34d399",
    fillOpacity: 0.16
  },
  promotion: {
    strokeWeight: 2,
    strokeColor: "#a16207",
    strokeOpacity: 0.9,
    fillColor: "#fbbf24",
    fillOpacity: 0.16
  },
  residential: {
    strokeWeight: 2,
    strokeColor: "#4338ca",
    strokeOpacity: 0.9,
    fillColor: "#a5b4fc",
    fillOpacity: 0.16
  }
};

const EMPTY_ZONE_COUNTS: Record<ProjectZoneCategory, number> = {
  "fast-track": 0,
  "moa-town": 0,
  redevelopment: 0,
  reconstruction: 0,
  "small-scale": 0,
  promotion: 0,
  residential: 0
};

// 같은 구역이 두 사업유형으로 등록된 경우(예: 재정비촉진구역 + 재개발) 이정표는 하나만
// 세운다. 숫자가 작을수록 라벨 주인이 될 우선순위가 높다.
const ZONE_LABEL_PRIORITY: Record<ProjectZoneCategory, number> = {
  "fast-track": 0,
  "moa-town": 1,
  redevelopment: 2,
  reconstruction: 3,
  "small-scale": 4,
  residential: 5,
  promotion: 6
};

const PROJECT_ZONE_CATEGORY_LABELS: Record<ProjectZoneCategory, string> = {
  "fast-track": "신속통합기획",
  "moa-town": "모아타운",
  redevelopment: "재개발",
  reconstruction: "재건축",
  "small-scale": "소규모정비",
  promotion: "재정비촉진",
  residential: "주거환경개선"
};

// 라벨 중복 판정을 위한 이름 정규화. 변환 스크립트의 normalized_name과 같은 규칙이다.
// "북아현3 재정비촉진구역 지구단위계획구역"처럼 접미사가 겹쳐 붙은 이름이 있어
// 더 이상 줄지 않을 때까지 반복해서 떼어낸다.
const ZONE_NAME_SUFFIX =
  /(?:주택정비형|도시정비형|소규모|가로주택|주택)?(?:재개발|재건축)?(?:재정비촉진|정비사업|정비구역|지구단위계획구역|지구단위계획|사업)?(?:구역|지구)$/;

function normalizeZoneName(value: string) {
  let text = (value ?? "").replace(/\([^)]*\)/g, "").replace(/\s/g, "");

  for (let index = 0; index < 4; index += 1) {
    const next = text.replace(ZONE_NAME_SUFFIX, "");

    if (next === text) {
      break;
    }

    text = next;
  }

  return text.replace(/[^0-9A-Za-z가-힣]/g, "");
}

function textValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

const EARTH_RADIUS_METERS = 6_378_137;
const SQUARE_METERS_PER_PYEONG = 3.305785;

const PROGRAM_TAG_LABELS: Record<string, string> = {
  fast_track_planning: "신속통합기획",
  moa_town: "모아타운",
  public_led: "공공시행",
  public_reconstruction: "공공재건축",
  public_redevelopment: "공공재개발",
  renewal_promotion_district: "재정비촉진지구",
  station_area: "역세권"
};

function programTagLabels(tags: string[] | undefined) {
  return (tags ?? []).map((tag) => PROGRAM_TAG_LABELS[tag] ?? tag);
}

// 원천 데이터의 사업유형 문자열을 지도 라벨용 짧은 표기로 정리한다.
// 예) "주택정비형재개발" → "재개발", "주거환경개선(현지개량)" → "주거환경개선"
const PROJECT_TYPE_SHORT_LABELS: Array<{ label: string; test: RegExp }> = [
  { label: "공공주택 복합지구", test: /공공주택\s*복합/ },
  { label: "공공주택지구", test: /공공주택지구/ },
  { label: "가로주택정비", test: /가로주택/ },
  { label: "자율주택정비", test: /자율주택/ },
  { label: "소규모재건축", test: /소규모재건축/ },
  { label: "소규모재개발", test: /소규모재개발/ },
  { label: "재정비촉진", test: /재정비촉진/ },
  { label: "주거환경개선", test: /주거환경개선/ },
  { label: "구역지정 후보지", test: /후보지/ },
  { label: "재개발", test: /재개발/ },
  { label: "재건축", test: /재건축/ }
];

function projectTypeShortLabel(projectType: string) {
  const normalized = projectType.trim();

  if (!normalized) {
    return "";
  }

  return (
    PROJECT_TYPE_SHORT_LABELS.find(({ test }) => test.test(normalized))?.label ??
    normalized
  );
}

// 정비사업의 "재개발 / 재건축" 해당 여부. 소규모·가로주택 유형도 상위 갈래로 함께 표기한다.
function redevelopmentCategoryLabel(projectType: string) {
  const normalized = projectType.trim();

  if (/재개발/.test(normalized)) {
    return "재개발";
  }

  if (/재건축/.test(normalized)) {
    return "재건축";
  }

  // 가로주택·자율주택은 소규모주택정비법상 재건축 계열로 분류된다.
  if (/가로주택|자율주택/.test(normalized)) {
    return "재건축";
  }

  return "";
}

// 지도 라벨에 노출할 사업유형 배지 목록.
// 신속통합기획·모아타운·공공주택 복합지구 같은 정책 유형을 앞에 두고,
// 재개발/재건축 해당사항을 뒤에 함께 붙인다.
// VWorld 구역 데이터처럼 유형이 "정비구역"으로만 오는 경우가 있어
// 사업명에서도 재개발/재건축 갈래를 찾아 보완한다.
function projectTypeBadges({
  programTags,
  projectName = "",
  projectType
}: {
  programTags?: string[];
  projectName?: string;
  projectType: string;
}) {
  const badges: Array<{ kind: "program" | "type" | "category"; label: string }> = [];
  const seen = new Set<string>();

  const push = (kind: "program" | "type" | "category", label: string) => {
    const normalized = label.trim();

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    badges.push({ kind, label: normalized });
  };

  programTagLabels(programTags).forEach((label) => push("program", label));

  const shortType = projectTypeShortLabel(projectType);
  push("type", shortType);
  push(
    "category",
    redevelopmentCategoryLabel(projectType) || redevelopmentCategoryLabel(projectName)
  );

  return badges;
}

const OFFICIAL_POLICY_SOURCES = [
  {
    name: "신속통합기획",
    summary: "309개 대상지 · 2026년 6월 기준",
    url: "https://news.seoul.go.kr/citybuild/plan-progress"
  },
  {
    name: "모아타운",
    summary: "132개 관리지역 · 2026년 3월 말 기준",
    url: "https://news.seoul.go.kr/citybuild/moa-housing-town/policy/status"
  },
  {
    name: "도심 공공주택 복합지구",
    summary: "수도권 지정지구 14개 경계 지도 연결",
    url: "https://www.data.go.kr/data/15160356/fileData.do"
  },
  {
    name: "서울플랜+ 통합 공간자료",
    summary: "신속통합·모아타운 포함 원본 공간자료",
    url: "https://data.seoul.go.kr/dataList/OA-22712/F/1/datasetView.do"
  },
  {
    name: "경기도 정비사업 온누리",
    summary: "경기도 시·군별 정비사업 공식 포털",
    url: "https://www.gg.go.kr/onnuri/"
  }
] as const;

function ringAreaSquareMeters(ring: number[][]) {
  const coordinates = ring.filter(
    (coordinate) =>
      coordinate.length >= 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
  );

  if (coordinates.length < 3) {
    return 0;
  }

  const referenceLatitude =
    (coordinates.reduce((sum, coordinate) => sum + coordinate[1], 0) /
      coordinates.length) *
    (Math.PI / 180);
  const [originLongitude, originLatitude] = coordinates[0];
  const longitudeScale = EARTH_RADIUS_METERS * Math.cos(referenceLatitude);
  const latitudeScale = EARTH_RADIUS_METERS;
  let area = 0;

  coordinates.forEach((coordinate, index) => {
    const nextCoordinate = coordinates[(index + 1) % coordinates.length];
    const x = (coordinate[0] - originLongitude) * (Math.PI / 180) * longitudeScale;
    const y = (coordinate[1] - originLatitude) * (Math.PI / 180) * latitudeScale;
    const nextX =
      (nextCoordinate[0] - originLongitude) * (Math.PI / 180) * longitudeScale;
    const nextY =
      (nextCoordinate[1] - originLatitude) * (Math.PI / 180) * latitudeScale;

    area += x * nextY - nextX * y;
  });

  return Math.abs(area / 2);
}

function polygonAreaSquareMeters(coordinates: number[][][]) {
  if (coordinates.length === 0) {
    return 0;
  }

  const outerArea = ringAreaSquareMeters(coordinates[0]);
  const holeArea = coordinates
    .slice(1)
    .reduce((sum, ring) => sum + ringAreaSquareMeters(ring), 0);

  return Math.max(0, outerArea - holeArea);
}

function geometryAreaSquareMeters(
  geometry: PolygonGeometry | MultiPolygonGeometry | null
) {
  if (!geometry) {
    return 0;
  }

  if (geometry.type === "Polygon") {
    return polygonAreaSquareMeters(geometry.coordinates);
  }

  return geometry.coordinates.reduce(
    (sum, polygon) => sum + polygonAreaSquareMeters(polygon),
    0
  );
}

function formatArea(value: number) {
  return (value >= 100 ? Math.round(value) : Math.round(value * 10) / 10).toLocaleString(
    "ko-KR"
  );
}

function formatAreaWithPyeong(value: number) {
  return `${formatArea(value)}㎡ (${formatArea(value / SQUARE_METERS_PER_PYEONG)}평)`;
}

// 폴리곤에서 라벨을 세울 대표 지점. 가장 넓은 외곽 링의 무게중심을 쓴다.
function representativePoint(
  geometry: PolygonGeometry | MultiPolygonGeometry | null
): { latitude: number; longitude: number } | null {
  if (!geometry) {
    return null;
  }

  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let bestRing: number[][] | null = null;
  let bestArea = -1;

  polygons.forEach((polygon) => {
    const ring = polygon?.[0];

    if (!Array.isArray(ring) || ring.length < 3) {
      return;
    }

    const area = ringAreaSquareMeters(ring);

    if (area > bestArea) {
      bestArea = area;
      bestRing = ring;
    }
  });

  if (!bestRing) {
    return null;
  }

  const points = (bestRing as number[][]).filter(
    (coordinate) =>
      coordinate.length >= 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
  );

  if (points.length === 0) {
    return null;
  }

  // 면적 가중 무게중심(shoelace). 면적이 0이면 좌표 평균으로 되돌린다.
  let twiceArea = 0;
  let longitude = 0;
  let latitude = 0;

  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[(index + 1) % points.length];
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    longitude += (x1 + x2) * cross;
    latitude += (y1 + y2) * cross;
  }

  if (Math.abs(twiceArea) < 1e-12) {
    const sum = points.reduce(
      (accumulator, [x, y]) => ({ x: accumulator.x + x, y: accumulator.y + y }),
      { x: 0, y: 0 }
    );

    return { latitude: sum.y / points.length, longitude: sum.x / points.length };
  }

  return {
    latitude: latitude / (3 * twiceArea),
    longitude: longitude / (3 * twiceArea)
  };
}

// 이 레벨보다 축소하면 라벨이 서로 겹쳐 지도를 가린다. 그 이상에서는 점으로만 표시한다.
const PROJECT_LABEL_MAX_LEVEL = 5;

// 지도 위 파란 이정표 라벨 DOM. 정비사업 지점과 구역 폴리곤이 함께 쓴다.
// compact 모드에서는 사업명·유형을 툴팁으로만 두고 작은 점으로 줄인다.
function createProjectPinElement({
  badges,
  compact,
  projectName
}: {
  badges: ReturnType<typeof projectTypeBadges>;
  compact: boolean;
  projectName: string;
}) {
  const summary = [projectName, ...badges.map(({ label }) => label)].join(" · ");
  const element = document.createElement("div");
  element.className = compact
    ? "map-project-pin map-project-pin--compact"
    : "map-project-pin";
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
  element.title = summary;

  const body = document.createElement("span");
  body.className = "map-project-pin__body";

  if (compact) {
    const label = document.createElement("span");
    label.className = "sr-only";
    label.textContent = summary;
    body.append(label);
    element.append(body);
  } else {
    const name = document.createElement("strong");
    name.className = "map-project-pin__name";
    name.textContent = projectName;
    body.append(name);

    if (badges.length > 0) {
      const badgeList = document.createElement("span");
      badgeList.className = "map-project-pin__badges";
      badges.forEach(({ kind, label }) => {
        const badge = document.createElement("span");
        badge.className = `map-project-pin__badge map-project-pin__badge--${kind}`;
        badge.textContent = label;
        badgeList.append(badge);
      });
      body.append(badgeList);
    }

    element.append(body);

    const tail = document.createElement("span");
    tail.className = "map-project-pin__tail";
    tail.setAttribute("aria-hidden", "true");
    element.append(tail);
  }

  // 키보드로도 선택할 수 있게 Enter/Space를 클릭으로 넘긴다.
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      element.click();
    }
  });

  return element;
}

function developmentProjectDisplayName(project: DevelopmentProjectDetail) {
  if (
    project.projectName.startsWith("공공주택지구 (") &&
    project.remark.includes("도심 공공주택 복합지구")
  ) {
    return project.remark
      .replace(/\s*(?:지정 및 지형도면.*|지정.*|고시.*)$/u, "")
      .trim();
  }

  return project.projectName;
}

function normalizeParcel(
  properties: ParcelFeatureCollection["features"][number]["properties"],
  geometry: PolygonGeometry | MultiPolygonGeometry | null
) {
  const price = Number(textValue(properties?.jiga));
  const areaSquareMeters = geometryAreaSquareMeters(geometry);

  return {
    address: textValue(properties?.addr),
    areaSquareMeters: areaSquareMeters > 0 ? areaSquareMeters : null,
    bonbun: textValue(properties?.bonbun),
    bubun: textValue(properties?.bubun),
    jibun: textValue(properties?.jibun),
    officialPrice: Number.isFinite(price) && price > 0 ? price : null,
    pnu: textValue(properties?.pnu),
    referenceMonth: textValue(properties?.gosi_month),
    referenceYear: textValue(properties?.gosi_year)
  } satisfies SelectedParcel;
}

let kakaoMapsLoader: Promise<KakaoMapsNamespace> | null = null;

function loadKakaoMaps(appKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 지도를 불러올 수 있습니다."));
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMapsNamespace>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (kakaoMapsLoader) {
    return kakaoMapsLoader;
  }

  kakaoMapsLoader = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const scriptId = "kakao-map-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        kakaoMapsLoader = null;
        reject(new Error("카카오 지도 SDK를 초기화하지 못했습니다."));
        return;
      }

      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    const handleError = () => {
      kakaoMapsLoader = null;
      reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false&libraries=services`;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return kakaoMapsLoader;
}

export function KakaoMapWorkspace({
  appKey,
  currentUser,
  vworldConfigured
}: KakaoMapWorkspaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const parcelDetailRef = useRef<HTMLElement>(null);
  const developmentDetailRef = useRef<HTMLElement>(null);
  const planningDetailRef = useRef<HTMLElement>(null);
  const mapsApiRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const placesRef = useRef<KakaoPlaces | null>(null);
  const geocoderRef = useRef<KakaoGeocoder | null>(null);
  const parcelPolygonsRef = useRef<ParcelPolygonEntry[]>([]);
  const developmentPolygonsRef = useRef<DevelopmentPolygonEntry[]>([]);
  const planningPolygonsRef = useRef<PlanningPolygonEntry[]>([]);
  const maintenanceMarkersRef = useRef<MaintenanceMarkerEntry[]>([]);
  const policyPolygonsRef = useRef<PlanningPolygonEntry[]>([]);
  const policyMarkersRef = useRef<MaintenanceMarkerEntry[]>([]);
  const selectedPolicyPolygonsRef = useRef<KakaoPolygon[]>([]);
  const selectedParcelPolygonsRef = useRef<KakaoPolygon[]>([]);
  const selectedDevelopmentPolygonsRef = useRef<KakaoPolygon[]>([]);
  const selectedPlanningPolygonsRef = useRef<KakaoPolygon[]>([]);
  const parcelRequestRef = useRef<AbortController | null>(null);
  const developmentRequestRef = useRef<AbortController | null>(null);
  const developmentDataRef = useRef<DevelopmentFeatureCollection | null>(null);
  const planningRequestRef = useRef<AbortController | null>(null);
  const policyRequestRef = useRef<AbortController | null>(null);
  const policyDataRef = useRef<ProjectZoneCollection | null>(null);
  // 서울 정비사업 구역이 이미 이정표를 세운 구역 이름. 포인트·VWorld 라벨 중복을 막는다.
  const zoneNameIndexRef = useRef<Set<string>>(new Set());
  // 구역 자료가 도착하기 전에 다른 레이어가 라벨을 그려 중복이 생기지 않도록 공유하는 로딩 약속.
  const policyLoadRef = useRef<Promise<ProjectZoneCollection> | null>(null);
  const maintenanceMatchRequestRef = useRef<AbortController | null>(null);
  const maintenanceDataRef = useRef<MaintenanceProjectCollection | null>(null);
  const landLedgerRequestRef = useRef<AbortController | null>(null);
  const parcelLayerEnabledRef = useRef(false);
  const developmentLayerEnabledRef = useRef(false);
  const planningLayerEnabledRef = useRef(false);
  const policyLayerEnabledRef = useRef(false);
  const parcelClickGuardRef = useRef(false);
  const refreshParcelsRef = useRef<() => void>(() => undefined);
  const refreshDevelopmentProjectsRef = useRef<() => void>(() => undefined);
  const refreshPlanningZonesRef = useRef<() => void>(() => undefined);
  const refreshPolicyZonesRef = useRef<() => void>(() => undefined);

  const [mapStatus, setMapStatus] = useState<MapStatus>(appKey ? "loading" : "missing-key");
  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("지도를 클릭하거나 주소를 검색해 보세요.");
  const [selectedCoordinates, setSelectedCoordinates] = useState("");
  const [parcelLayerEnabled, setParcelLayerEnabled] = useState(false);
  const [developmentLayerEnabled, setDevelopmentLayerEnabled] = useState(false);
  const [planningLayerEnabled, setPlanningLayerEnabled] = useState(false);
  const [policyLayerEnabled, setPolicyLayerEnabled] = useState(false);
  const [policyStatus, setPolicyStatus] = useState<PolicyStatus>("idle");
  const [policyCounts, setPolicyCounts] = useState<Record<ProjectZoneCategory, number>>(
    () => ({ ...EMPTY_ZONE_COUNTS })
  );
  const [policySourceNote, setPolicySourceNote] = useState("");
  const [policySource, setPolicySource] = useState<
    ProjectZoneCollection["metadata"] | null
  >(null);
  const [selectedPolicyZone, setSelectedPolicyZone] = useState<ProjectZoneDetail | null>(
    null
  );
  const [parcelStatus, setParcelStatus] = useState<ParcelStatus>("idle");
  const [developmentStatus, setDevelopmentStatus] =
    useState<DevelopmentStatus>("idle");
  const [planningStatus, setPlanningStatus] = useState<PlanningStatus>("idle");
  const [parcelCount, setParcelCount] = useState(0);
  const [developmentCount, setDevelopmentCount] = useState(0);
  const [developmentTruncated, setDevelopmentTruncated] = useState(false);
  const [planningCounts, setPlanningCounts] = useState<Record<PlanningCategory, number>>({
    maintenance: 0,
    "urban-development": 0,
    "housing-site": 0
  });
  const [planningTruncated, setPlanningTruncated] = useState(false);
  const [maintenancePointCount, setMaintenancePointCount] = useState(0);
  const [selectedParcel, setSelectedParcel] = useState<SelectedParcel | null>(null);
  const [selectedDevelopmentProject, setSelectedDevelopmentProject] =
    useState<DevelopmentProjectDetail | null>(null);
  const [selectedPlanningZone, setSelectedPlanningZone] =
    useState<PlanningZoneDetail | null>(null);
  const [maintenanceProjectDetail, setMaintenanceProjectDetail] =
    useState<MaintenanceProjectDetail | null>(null);
  const [maintenanceMatchStatus, setMaintenanceMatchStatus] =
    useState<MaintenanceMatchStatus>("idle");
  const [landLedger, setLandLedger] = useState<LandLedger | null>(null);
  const [landLedgerStatus, setLandLedgerStatus] =
    useState<LandLedgerStatus>("idle");

  function moveMarker(position: KakaoLatLng) {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      return;
    }

    markerRef.current = new maps.Marker({ map, position });
  }

  const clearSelectedParcel = useCallback(() => {
    landLedgerRequestRef.current?.abort();
    selectedParcelPolygonsRef.current.forEach((polygon) => {
      polygon.setOptions(DEFAULT_PARCEL_STYLE);
    });
    selectedParcelPolygonsRef.current = [];
    setSelectedParcel(null);
    setLandLedger(null);
    setLandLedgerStatus("idle");
  }, []);

  const clearParcelPolygons = useCallback(() => {
    const maps = mapsApiRef.current;

    landLedgerRequestRef.current?.abort();
    parcelPolygonsRef.current.forEach(({ clickHandler, polygon }) => {
      maps?.event.removeListener(polygon, "click", clickHandler);
      polygon.setMap(null);
    });
    parcelPolygonsRef.current = [];
    selectedParcelPolygonsRef.current = [];
    setParcelCount(0);
    setSelectedParcel(null);
    setLandLedger(null);
    setLandLedgerStatus("idle");
  }, []);

  const clearSelectedDevelopmentProject = useCallback(() => {
    selectedDevelopmentPolygonsRef.current.forEach((polygon) => {
      polygon.setOptions(DEFAULT_DEVELOPMENT_STYLE);
    });
    selectedDevelopmentPolygonsRef.current = [];
    setSelectedDevelopmentProject(null);
  }, []);

  const clearDevelopmentPolygons = useCallback(() => {
    const maps = mapsApiRef.current;

    developmentRequestRef.current?.abort();
    developmentPolygonsRef.current.forEach(({ clickHandler, polygon }) => {
      maps?.event.removeListener(polygon, "click", clickHandler);
      polygon.setMap(null);
    });
    developmentPolygonsRef.current = [];
    selectedDevelopmentPolygonsRef.current = [];
    setDevelopmentCount(0);
    setDevelopmentTruncated(false);
    setSelectedDevelopmentProject(null);
  }, []);

  const clearSelectedPlanningZone = useCallback(() => {
    maintenanceMatchRequestRef.current?.abort();
    selectedPlanningPolygonsRef.current.forEach((polygon) => {
      const category = (polygon as KakaoPolygon & { planningCategory?: PlanningCategory })
        .planningCategory;
      polygon.setOptions(
        category ? PLANNING_ZONE_STYLES[category] : PLANNING_ZONE_STYLES.maintenance
      );
    });
    selectedPlanningPolygonsRef.current = [];
    setSelectedPlanningZone(null);
    setMaintenanceProjectDetail(null);
    setMaintenanceMatchStatus("idle");
  }, []);

  const clearPlanningPolygons = useCallback(() => {
    const maps = mapsApiRef.current;

    planningRequestRef.current?.abort();
    maintenanceMatchRequestRef.current?.abort();
    planningPolygonsRef.current.forEach(({ clickHandler, polygon }) => {
      maps?.event.removeListener(polygon, "click", clickHandler);
      polygon.setMap(null);
    });
    maintenanceMarkersRef.current.forEach(({ clickHandler, element, overlay }) => {
      element.removeEventListener("click", clickHandler);
      overlay.setMap(null);
    });
    planningPolygonsRef.current = [];
    maintenanceMarkersRef.current = [];
    selectedPlanningPolygonsRef.current = [];
    setPlanningCounts({
      maintenance: 0,
      "urban-development": 0,
      "housing-site": 0
    });
    setPlanningTruncated(false);
    setMaintenancePointCount(0);
    setSelectedPlanningZone(null);
    setMaintenanceProjectDetail(null);
    setMaintenanceMatchStatus("idle");
  }, []);

  const loadLandLedger = useCallback(async (pnu: string) => {
    landLedgerRequestRef.current?.abort();
    setLandLedger(null);

    if (!/^\d{19}$/.test(pnu)) {
      setLandLedgerStatus("not-found");
      return;
    }

    const controller = new AbortController();
    landLedgerRequestRef.current = controller;
    setLandLedgerStatus("loading");

    try {
      const response = await fetch(
        `/api/vworld/land-ledger?pnu=${encodeURIComponent(pnu)}`,
        {
          signal: controller.signal
        }
      );

      if (controller.signal.aborted) {
        return;
      }

      if (response.status === 404) {
        setLandLedgerStatus("not-found");
        return;
      }

      if (!response.ok) {
        throw new Error("토지대장 정보를 불러오지 못했습니다.");
      }

      const ledger = (await response.json()) as LandLedger;

      if (controller.signal.aborted) {
        return;
      }

      setLandLedger(ledger);
      setLandLedgerStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setLandLedgerStatus("error");
    }
  }, []);

  const clearPolicyZones = useCallback(() => {
    policyRequestRef.current?.abort();
    policyPolygonsRef.current.forEach(({ clickHandler, polygon }) => {
      mapsApiRef.current?.event.removeListener(polygon, "click", clickHandler);
      polygon.setMap(null);
    });
    policyMarkersRef.current.forEach(({ clickHandler, element, overlay }) => {
      element.removeEventListener("click", clickHandler);
      overlay.setMap(null);
    });
    policyPolygonsRef.current = [];
    policyMarkersRef.current = [];
    selectedPolicyPolygonsRef.current = [];
    setPolicyCounts({ ...EMPTY_ZONE_COUNTS });
    setSelectedPolicyZone(null);
  }, []);

  // 구역 자료는 한 번만 받아 캐시하고, 동시에 여러 레이어가 요청하면 같은 약속을 공유한다.
  const loadProjectZones = useCallback(() => {
    if (policyDataRef.current) {
      return Promise.resolve(policyDataRef.current);
    }

    if (!policyLoadRef.current) {
      policyLoadRef.current = fetch("/data/seoul-project-zones.geojson")
        .then((response) => {
          if (!response.ok) {
            throw new Error("PROJECT_ZONES_REQUEST_FAILED");
          }

          return response.json() as Promise<ProjectZoneCollection>;
        })
        .then((collection) => {
          policyDataRef.current = collection;
          zoneNameIndexRef.current = new Set(
            collection.features
              .map((feature) => feature.properties.normalizedName)
              .filter(Boolean)
          );
          return collection;
        })
        .catch((error) => {
          policyLoadRef.current = null;
          throw error;
        });
    }

    return policyLoadRef.current;
  }, []);

  const refreshPolicyZones = useCallback(async () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map || !policyLayerEnabledRef.current) {
      return;
    }

    if (map.getLevel() > 10) {
      policyRequestRef.current?.abort();
      clearPolicyZones();
      setPolicyStatus("zoom-in");
      return;
    }

    policyRequestRef.current?.abort();
    const controller = new AbortController();
    policyRequestRef.current = controller;
    setPolicyStatus("loading");

    try {
      const collection = await loadProjectZones();

      if (controller.signal.aborted) {
        return;
      }

      clearPolicyZones();

      const useCompactPins = map.getLevel() > PROJECT_LABEL_MAX_LEVEL;
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const counts: Record<ProjectZoneCategory, number> = { ...EMPTY_ZONE_COUNTS };

      const visibleFeatures = collection.features.filter((feature) => {
        const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
          feature.properties.bounds;

        return (
          maxLongitude >= southWest.getLng() &&
          minLongitude <= northEast.getLng() &&
          maxLatitude >= southWest.getLat() &&
          minLatitude <= northEast.getLat()
        );
      });

      // 같은 구역이 여러 사업유형으로 잡히면 우선순위가 높은 쪽만 이정표를 갖는다.
      visibleFeatures.sort(
        (left, right) =>
          ZONE_LABEL_PRIORITY[left.properties.category] -
          ZONE_LABEL_PRIORITY[right.properties.category]
      );
      const labelledZoneNames = new Set<string>();

      visibleFeatures.forEach((feature) => {
        if (!feature.geometry) {
          return;
        }

        const category = feature.properties.category;
        const featurePolygons: KakaoPolygon[] = [];
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        polygons.forEach((polygonCoordinates) => {
          const paths = polygonCoordinates
            .map((ring) =>
              ring
                .filter(
                  (coordinate) =>
                    coordinate.length >= 2 &&
                    Number.isFinite(coordinate[0]) &&
                    Number.isFinite(coordinate[1])
                )
                .map((coordinate) => new maps.LatLng(coordinate[1], coordinate[0]))
            )
            .filter((ring) => ring.length >= 3);

          if (paths.length === 0) {
            return;
          }

          const polygon = new maps.Polygon({
            map,
            path: paths.length === 1 ? paths[0] : paths,
            strokeStyle: "solid",
            ...PROJECT_ZONE_STYLES[category]
          });
          (
            polygon as KakaoPolygon & { zoneCategory?: ProjectZoneCategory }
          ).zoneCategory = category;
          featurePolygons.push(polygon);
        });

        if (featurePolygons.length === 0) {
          return;
        }

        counts[category] += 1;

        const selectZone = (latLng: KakaoLatLng) => {
          parcelClickGuardRef.current = true;
          clearSelectedParcel();
          clearSelectedDevelopmentProject();

          selectedPolicyPolygonsRef.current.forEach((polygon) => {
            const previous = (
              polygon as KakaoPolygon & { zoneCategory?: ProjectZoneCategory }
            ).zoneCategory;
            polygon.setOptions(
              previous ? PROJECT_ZONE_STYLES[previous] : PROJECT_ZONE_STYLES.redevelopment
            );
          });
          featurePolygons.forEach((polygon) => {
            polygon.setOptions(SELECTED_PLANNING_STYLE);
          });

          selectedPolicyPolygonsRef.current = featurePolygons;
          setSelectedPolicyZone(feature.properties);
          setSelectedAddress(feature.properties.projectName);
          setSelectedCoordinates(
            `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
          );
          setSearchMessage(`${feature.properties.projectType} 구역을 선택했습니다.`);
          moveMarker(latLng);

          window.requestAnimationFrame(() => {
            parcelClickGuardRef.current = false;
          });
        };

        const clickHandler = ({ latLng }: { latLng: KakaoLatLng }) => {
          maps.event.preventMap();
          selectZone(latLng);
        };

        featurePolygons.forEach((polygon) => {
          maps.event.addListener(polygon, "click", clickHandler);
          policyPolygonsRef.current.push({ clickHandler, polygon });
        });

        const zoneKey = feature.properties.normalizedName;
        const labelPoint = zoneKey && labelledZoneNames.has(zoneKey)
          ? null
          : representativePoint(feature.geometry);

        if (labelPoint) {
          if (zoneKey) {
            labelledZoneNames.add(zoneKey);
          }

          const labelPosition = new maps.LatLng(
            labelPoint.latitude,
            labelPoint.longitude
          );
          const labelElement = createProjectPinElement({
            badges: projectTypeBadges({
              programTags: feature.properties.programTags,
              projectName: feature.properties.projectName,
              projectType: feature.properties.projectType
            }),
            compact: useCompactPins,
            projectName: feature.properties.projectName
          });
          const labelClickHandler = () => {
            selectZone(labelPosition);
          };
          const labelOverlay = new maps.CustomOverlay({
            clickable: true,
            content: labelElement,
            map,
            position: labelPosition,
            yAnchor: 1,
            zIndex: 5
          });

          labelElement.addEventListener("click", labelClickHandler);
          policyMarkersRef.current.push({
            clickHandler: labelClickHandler,
            element: labelElement,
            overlay: labelOverlay
          });
        }
      });

      setPolicyCounts(counts);
      setPolicySourceNote(
        `${collection.metadata.sourceName} · ${collection.metadata.sourceBaseDate} 기준`
      );
      setPolicySource(collection.metadata);
      setPolicyStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      clearPolicyZones();
      setPolicyStatus("error");
    }
  }, [
    clearPolicyZones,
    clearSelectedDevelopmentProject,
    clearSelectedParcel,
    loadProjectZones
  ]);

  const refreshParcels = useCallback(async () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map || !parcelLayerEnabledRef.current) {
      return;
    }

    if (!vworldConfigured) {
      clearParcelPolygons();
      setParcelStatus("not-configured");
      return;
    }

    if (map.getLevel() > 5) {
      parcelRequestRef.current?.abort();
      clearParcelPolygons();
      setParcelStatus("zoom-in");
      return;
    }

    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const bbox = [
      southWest.getLng(),
      southWest.getLat(),
      northEast.getLng(),
      northEast.getLat()
    ].join(",");

    parcelRequestRef.current?.abort();
    const controller = new AbortController();
    parcelRequestRef.current = controller;
    setParcelStatus("loading");

    try {
      const response = await fetch(`/api/vworld/parcels?bbox=${encodeURIComponent(bbox)}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("필지 정보를 불러오지 못했습니다.");
      }

      const featureCollection = (await response.json()) as ParcelFeatureCollection;

      if (controller.signal.aborted) {
        return;
      }

      clearParcelPolygons();

      let renderedParcelCount = 0;

      featureCollection.features.forEach((feature) => {
        if (!feature.geometry) {
          return;
        }

        const parcel = normalizeParcel(feature.properties, feature.geometry);
        const featurePolygons: KakaoPolygon[] = [];
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        polygons.forEach((polygonCoordinates) => {
          const paths = polygonCoordinates
            .map((ring) =>
              ring
                .filter(
                  (coordinate) =>
                    coordinate.length >= 2 &&
                    Number.isFinite(coordinate[0]) &&
                    Number.isFinite(coordinate[1])
                )
                .map((coordinate) => new maps.LatLng(coordinate[1], coordinate[0]))
            )
            .filter((ring) => ring.length >= 3);

          if (paths.length === 0) {
            return;
          }

          featurePolygons.push(
            new maps.Polygon({
              map,
              path: paths.length === 1 ? paths[0] : paths,
              strokeStyle: "solid",
              ...DEFAULT_PARCEL_STYLE
            })
          );
        });

        if (featurePolygons.length === 0) {
          return;
        }

        renderedParcelCount += 1;

        const clickHandler = ({ latLng }: { latLng: KakaoLatLng }) => {
          maps.event.preventMap();
          parcelClickGuardRef.current = true;

          selectedParcelPolygonsRef.current.forEach((polygon) => {
            polygon.setOptions(DEFAULT_PARCEL_STYLE);
          });
          featurePolygons.forEach((polygon) => {
            polygon.setOptions(SELECTED_PARCEL_STYLE);
          });

          selectedParcelPolygonsRef.current = featurePolygons;
          setSelectedParcel(parcel);
          void loadLandLedger(parcel.pnu);
          setSelectedAddress(parcel.address || parcel.jibun || "선택한 필지");
          setSelectedCoordinates(
            `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
          );
          setSearchMessage("필지를 선택했습니다.");
          moveMarker(latLng);

          window.requestAnimationFrame(() => {
            parcelClickGuardRef.current = false;
          });
        };

        featurePolygons.forEach((polygon) => {
          maps.event.addListener(polygon, "click", clickHandler);
          parcelPolygonsRef.current.push({ clickHandler, polygon });
        });
      });

      setParcelCount(renderedParcelCount);
      setParcelStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      clearParcelPolygons();
      setParcelStatus("error");
    }
  }, [clearParcelPolygons, loadLandLedger, vworldConfigured]);

  const refreshDevelopmentProjects = useCallback(async () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map || !developmentLayerEnabledRef.current) {
      return;
    }

    if (map.getLevel() > 10) {
      developmentRequestRef.current?.abort();
      clearDevelopmentPolygons();
      setDevelopmentStatus("zoom-in");
      return;
    }

    developmentRequestRef.current?.abort();
    const controller = new AbortController();
    developmentRequestRef.current = controller;
    setDevelopmentStatus("loading");

    try {
      let featureCollection = developmentDataRef.current;

      if (!featureCollection) {
        const response = await fetch("/data/development-projects-capital-region.geojson", {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("개발사업 경계를 불러오지 못했습니다.");
        }

        featureCollection = (await response.json()) as DevelopmentFeatureCollection;
        developmentDataRef.current = featureCollection;
      }

      if (controller.signal.aborted) {
        return;
      }

      clearDevelopmentPolygons();
      let renderedProjectCount = 0;
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const visibleFeatures = featureCollection.features.filter((feature) => {
        const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
          feature.properties.bounds;

        return (
          maxLongitude >= southWest.getLng() &&
          minLongitude <= northEast.getLng() &&
          maxLatitude >= southWest.getLat() &&
          minLatitude <= northEast.getLat()
        );
      });

      visibleFeatures.forEach((feature) => {
        if (!feature.geometry || !feature.properties.projectName) {
          return;
        }

        const featurePolygons: KakaoPolygon[] = [];
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        polygons.forEach((polygonCoordinates) => {
          const paths = polygonCoordinates
            .map((ring) =>
              ring
                .filter(
                  (coordinate) =>
                    coordinate.length >= 2 &&
                    Number.isFinite(coordinate[0]) &&
                    Number.isFinite(coordinate[1])
                )
                .map((coordinate) => new maps.LatLng(coordinate[1], coordinate[0]))
            )
            .filter((ring) => ring.length >= 3);

          if (paths.length === 0) {
            return;
          }

          featurePolygons.push(
            new maps.Polygon({
              map,
              path: paths.length === 1 ? paths[0] : paths,
              strokeStyle: "solid",
              ...DEFAULT_DEVELOPMENT_STYLE
            })
          );
        });

        if (featurePolygons.length === 0) {
          return;
        }

        renderedProjectCount += 1;

        const clickHandler = ({ latLng }: { latLng: KakaoLatLng }) => {
          maps.event.preventMap();
          parcelClickGuardRef.current = true;
          clearSelectedParcel();
          clearSelectedPlanningZone();

          selectedDevelopmentPolygonsRef.current.forEach((polygon) => {
            polygon.setOptions(DEFAULT_DEVELOPMENT_STYLE);
          });
          featurePolygons.forEach((polygon) => {
            polygon.setOptions(SELECTED_DEVELOPMENT_STYLE);
          });

          selectedDevelopmentPolygonsRef.current = featurePolygons;
          setSelectedDevelopmentProject(feature.properties);
          setSelectedAddress(feature.properties.projectName);
          setSelectedCoordinates(
            `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
          );
          setSearchMessage("공공주택지구를 선택했습니다.");
          moveMarker(latLng);

          window.requestAnimationFrame(() => {
            parcelClickGuardRef.current = false;
          });
        };

        featurePolygons.forEach((polygon) => {
          maps.event.addListener(polygon, "click", clickHandler);
          developmentPolygonsRef.current.push({ clickHandler, polygon });
        });
      });

      setDevelopmentCount(renderedProjectCount);
      setDevelopmentTruncated(Boolean(featureCollection.truncated));
      setDevelopmentStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      clearDevelopmentPolygons();
      setDevelopmentStatus("error");
    }
  }, [
    clearDevelopmentPolygons,
    clearSelectedParcel,
    clearSelectedPlanningZone
  ]);

  const loadMaintenanceProjectDetail = useCallback(
    async (zone: PlanningZoneDetail) => {
      maintenanceMatchRequestRef.current?.abort();
      setMaintenanceProjectDetail(null);

      if (zone.category !== "maintenance" || !zone.districtCode.startsWith("28")) {
        setMaintenanceMatchStatus("idle");
        return;
      }

      const controller = new AbortController();
      maintenanceMatchRequestRef.current = controller;
      setMaintenanceMatchStatus("loading");

      try {
        const response = await fetch(
          `/api/maintenance-projects/match?name=${encodeURIComponent(
            zone.projectName
          )}&regionCode=28`,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) {
          return;
        }

        if (response.status === 404) {
          setMaintenanceMatchStatus("not-found");
          return;
        }

        if (!response.ok) {
          throw new Error("MAINTENANCE_PROJECT_REQUEST_FAILED");
        }

        const detail = (await response.json()) as MaintenanceProjectDetail;
        setMaintenanceProjectDetail(detail);
        setMaintenanceMatchStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMaintenanceMatchStatus("error");
      }
    },
    []
  );

  const refreshPlanningZones = useCallback(async () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map || !planningLayerEnabledRef.current) {
      return;
    }

    if (!vworldConfigured) {
      clearPlanningPolygons();
      setPlanningStatus("not-configured");
      return;
    }

    if (map.getLevel() > 10) {
      planningRequestRef.current?.abort();
      clearPlanningPolygons();
      setPlanningStatus("zoom-in");
      return;
    }

    // 넓게 축소한 상태에서 라벨을 전부 세우면 서로 겹쳐 지도를 덮는다.
    const useCompactPins = map.getLevel() > PROJECT_LABEL_MAX_LEVEL;
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const bbox = [
      southWest.getLng(),
      southWest.getLat(),
      northEast.getLng(),
      northEast.getLat()
    ].join(",");
    const categories: PlanningCategory[] = [
      "maintenance",
      "urban-development",
      "housing-site"
    ];

    planningRequestRef.current?.abort();
    const controller = new AbortController();
    planningRequestRef.current = controller;
    setPlanningStatus("loading");

    try {
      // 서울 정비사업 구역이 켜져 있으면 그 이름 색인이 준비된 뒤에 라벨을 그린다.
      // 그러지 않으면 첫 로딩에서 같은 구역에 이정표가 두 번 세워진다.
      if (policyLayerEnabledRef.current) {
        await loadProjectZones().catch(() => undefined);

        if (controller.signal.aborted) {
          return;
        }
      }

      const [collections, maintenanceCollection] = await Promise.all([
        Promise.all(
          categories.map(async (category) => {
            const response = await fetch(
              `/api/vworld/planning-zones?bbox=${encodeURIComponent(
                bbox
              )}&category=${category}`,
              { signal: controller.signal }
            );

            if (response.status === 503) {
              throw new Error("VWORLD_NOT_CONFIGURED");
            }

            if (!response.ok) {
              throw new Error("PLANNING_ZONES_REQUEST_FAILED");
            }

            return (await response.json()) as PlanningFeatureCollection;
          })
        ),
        (async () => {
          if (maintenanceDataRef.current) {
            return maintenanceDataRef.current;
          }

          // 경기 자료는 인증키로 새로 받아야 하므로 아직 없을 수 있다. 없으면 건너뛴다.
          const sourceCollections = (
            await Promise.all(
              [
                "/data/seoul-maintenance-projects.json",
                "/data/incheon-maintenance-projects.json",
                "/data/gyeonggi-maintenance-projects.json"
              ].map(async (url) => {
                const response = await fetch(url, { signal: controller.signal });

                if (!response.ok) {
                  if (url.includes("gyeonggi")) {
                    return null;
                  }

                  throw new Error("MAINTENANCE_DATA_REQUEST_FAILED");
                }

                return (await response.json()) as MaintenanceProjectCollection;
              })
            )
          ).filter((value): value is MaintenanceProjectCollection => value !== null);
          const collection: MaintenanceProjectCollection = {
            projects: sourceCollections.flatMap(({ projects }) => projects),
            total: sourceCollections.reduce(
              (total, sourceCollection) => total + sourceCollection.total,
              0
            ),
            type: "LandViewMaintenanceProjectCollection"
          };
          maintenanceDataRef.current = collection;
          return collection;
        })()
      ]);

      if (controller.signal.aborted) {
        return;
      }

      clearPlanningPolygons();
      const counts: Record<PlanningCategory, number> = {
        maintenance: 0,
        "urban-development": 0,
        "housing-site": 0
      };

      collections.forEach((collection) => {
        collection.features.forEach((feature) => {
          if (!feature.geometry || !feature.properties.projectName) {
            return;
          }

          const category = feature.properties.category;
          const featurePolygons: KakaoPolygon[] = [];
          const polygons =
            feature.geometry.type === "Polygon"
              ? [feature.geometry.coordinates]
              : feature.geometry.coordinates;

          polygons.forEach((polygonCoordinates) => {
            const paths = polygonCoordinates
              .map((ring) =>
                ring
                  .filter(
                    (coordinate) =>
                      coordinate.length >= 2 &&
                      Number.isFinite(coordinate[0]) &&
                      Number.isFinite(coordinate[1])
                  )
                  .map((coordinate) => new maps.LatLng(coordinate[1], coordinate[0]))
              )
              .filter((ring) => ring.length >= 3);

            if (paths.length === 0) {
              return;
            }

            const polygon = new maps.Polygon({
              map,
              path: paths.length === 1 ? paths[0] : paths,
              strokeStyle: "solid",
              ...PLANNING_ZONE_STYLES[category]
            });
            (
              polygon as KakaoPolygon & { planningCategory?: PlanningCategory }
            ).planningCategory = category;
            featurePolygons.push(polygon);
          });

          if (featurePolygons.length === 0) {
            return;
          }

          counts[category] += 1;

          const selectZone = (latLng: KakaoLatLng) => {
            parcelClickGuardRef.current = true;
            clearSelectedParcel();
            clearSelectedDevelopmentProject();

            selectedPlanningPolygonsRef.current.forEach((polygon) => {
              const previousCategory = (
                polygon as KakaoPolygon & { planningCategory?: PlanningCategory }
              ).planningCategory;
              polygon.setOptions(
                previousCategory
                  ? PLANNING_ZONE_STYLES[previousCategory]
                  : PLANNING_ZONE_STYLES.maintenance
              );
            });
            featurePolygons.forEach((polygon) => {
              polygon.setOptions(SELECTED_PLANNING_STYLE);
            });

            selectedPlanningPolygonsRef.current = featurePolygons;
            setSelectedPlanningZone(feature.properties);
            void loadMaintenanceProjectDetail(feature.properties);
            setSelectedAddress(feature.properties.projectName);
            setSelectedCoordinates(
              `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
            );
            setSearchMessage(`${feature.properties.projectType}를 선택했습니다.`);
            moveMarker(latLng);

            window.requestAnimationFrame(() => {
              parcelClickGuardRef.current = false;
            });
          };

          const clickHandler = ({ latLng }: { latLng: KakaoLatLng }) => {
            maps.event.preventMap();
            selectZone(latLng);
          };

          featurePolygons.forEach((polygon) => {
            maps.event.addListener(polygon, "click", clickHandler);
            planningPolygonsRef.current.push({ clickHandler, polygon });
          });

          // 구역 위에 공식 사업명·사업유형 이정표를 세운다.
          // 서울 정비사업 레이어가 같은 구역에 이미 이정표를 세웠다면 건너뛴다.
          const alreadyLabelled =
            policyLayerEnabledRef.current &&
            zoneNameIndexRef.current.has(
              normalizeZoneName(feature.properties.projectName)
            );
          const labelPoint = alreadyLabelled
            ? null
            : representativePoint(feature.geometry);

          if (labelPoint) {
            const labelPosition = new maps.LatLng(
              labelPoint.latitude,
              labelPoint.longitude
            );
            const labelElement = createProjectPinElement({
              badges: projectTypeBadges({
                programTags: feature.properties.programTags,
                projectName: feature.properties.projectName,
                projectType: feature.properties.projectType
              }),
              compact: useCompactPins,
              projectName: feature.properties.projectName
            });
            // clickable 오버레이라 지도로 전파되지 않는다. preventMap 없이 선택만 수행한다.
            const labelClickHandler = () => {
              selectZone(labelPosition);
            };
            const labelOverlay = new maps.CustomOverlay({
              clickable: true,
              content: labelElement,
              map,
              position: labelPosition,
              yAnchor: 1,
              zIndex: 3
            });

            labelElement.addEventListener("click", labelClickHandler);
            maintenanceMarkersRef.current.push({
              clickHandler: labelClickHandler,
              element: labelElement,
              overlay: labelOverlay
            });
          }
        });
      });

      const visibleMaintenanceProjects = maintenanceCollection.projects.filter(
        (project) =>
          project.center &&
          project.center.longitude >= southWest.getLng() &&
          project.center.longitude <= northEast.getLng() &&
          project.center.latitude >= southWest.getLat() &&
          project.center.latitude <= northEast.getLat()
      );

      // 서울 정비사업 구역 레이어가 같은 구역을 이미 그렸다면 점 이정표를 겹쳐 세우지 않는다.
      const unlabelledMaintenanceProjects = visibleMaintenanceProjects.filter(
        (project) =>
          !(
            policyLayerEnabledRef.current &&
            zoneNameIndexRef.current.has(normalizeZoneName(project.projectName))
          )
      );

      unlabelledMaintenanceProjects.forEach((project) => {
        if (!project.center) {
          return;
        }

        const position = new maps.LatLng(
          project.center.latitude,
          project.center.longitude
        );
        const element = createProjectPinElement({
          badges: projectTypeBadges({
            programTags: project.programTags,
            projectName: project.projectName,
            projectType: project.projectType
          }),
          compact: useCompactPins,
          projectName: project.projectName
        });

        const overlay = new maps.CustomOverlay({
          clickable: true,
          content: element,
          map,
          position,
          yAnchor: 1,
          zIndex: 4
        });
        const clickHandler = () => {
          const regionName =
            project.regionCode === "11"
              ? "서울특별시"
              : project.regionCode === "28"
                ? "인천광역시"
                : "경기도";
          // clickable 오버레이라 지도 클릭으로 전파되지 않는다. 필지 선택만 막아둔다.
          parcelClickGuardRef.current = true;
          maintenanceMatchRequestRef.current?.abort();
          clearSelectedParcel();
          clearSelectedDevelopmentProject();

          selectedPlanningPolygonsRef.current.forEach((polygon) => {
            const previousCategory = (
              polygon as KakaoPolygon & { planningCategory?: PlanningCategory }
            ).planningCategory;
            polygon.setOptions(
              previousCategory
                ? PLANNING_ZONE_STYLES[previousCategory]
                : PLANNING_ZONE_STYLES.maintenance
            );
          });
          selectedPlanningPolygonsRef.current = [];

          setSelectedPlanningZone({
            areaSquareMeters: project.areaSquareMeters,
            category: "maintenance",
            classification: `${project.sourceProvider} 정비사업 추진현황`,
            districtCode: project.regionCode,
            noticeId: "",
            programTags: project.programTags ?? [],
            projectName: project.projectName,
            projectType: project.projectType,
            regionName: `${regionName} ${project.districtName}`.trim(),
            sourceName: project.sourceProvider,
            statusName: project.businessStage
          });
          setMaintenanceProjectDetail(project);
          setMaintenanceMatchStatus("ready");
          setSelectedAddress(
            project.center?.matchedAddress ||
              `${regionName} ${project.districtName} ${project.location}`.trim()
          );
          setSelectedCoordinates(
            `${position.getLat().toFixed(6)}, ${position.getLng().toFixed(6)}`
          );
          setSearchMessage(`${project.projectName} 추진현황을 선택했습니다.`);
          moveMarker(position);

          window.requestAnimationFrame(() => {
            parcelClickGuardRef.current = false;
          });
        };

        element.addEventListener("click", clickHandler);
        maintenanceMarkersRef.current.push({ clickHandler, element, overlay });
      });

      setPlanningCounts(counts);
      setMaintenancePointCount(unlabelledMaintenanceProjects.length);
      setPlanningTruncated(collections.some((collection) => collection.truncated));
      setPlanningStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      clearPlanningPolygons();
      setPlanningStatus(
        error instanceof Error && error.message === "VWORLD_NOT_CONFIGURED"
          ? "not-configured"
          : "error"
      );
    }
  }, [
    clearPlanningPolygons,
    clearSelectedDevelopmentProject,
    clearSelectedParcel,
    loadMaintenanceProjectDetail,
    loadProjectZones,
    vworldConfigured
  ]);

  useEffect(() => {
    refreshParcelsRef.current = () => {
      void refreshParcels();
    };
  }, [refreshParcels]);

  useEffect(() => {
    refreshDevelopmentProjectsRef.current = () => {
      void refreshDevelopmentProjects();
    };
  }, [refreshDevelopmentProjects]);

  useEffect(() => {
    refreshPlanningZonesRef.current = () => {
      void refreshPlanningZones();
    };
  }, [refreshPlanningZones]);

  useEffect(() => {
    refreshPolicyZonesRef.current = () => {
      void refreshPolicyZones();
    };
  }, [refreshPolicyZones]);

  useEffect(() => {
    if (!selectedParcel) {
      return;
    }

    parcelDetailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [selectedParcel]);

  useEffect(() => {
    if (!selectedDevelopmentProject) {
      return;
    }

    developmentDetailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [selectedDevelopmentProject]);

  useEffect(() => {
    if (!selectedPlanningZone) {
      return;
    }

    planningDetailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [selectedPlanningZone]);

  useEffect(() => {
    if (!appKey || !mapContainerRef.current) {
      return;
    }

    let disposed = false;
    let clickHandler: ((event: { latLng: KakaoLatLng }) => void) | null = null;
    let idleHandler: (() => void) | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (disposed || !mapContainerRef.current) {
          return;
        }

        const center = new maps.LatLng(36.35, 127.8);
        const map = new maps.Map(mapContainerRef.current, {
          center,
          level: 13
        });

        mapsApiRef.current = maps;
        mapRef.current = map;
        placesRef.current = new maps.services.Places();
        geocoderRef.current = new maps.services.Geocoder();

        clickHandler = ({ latLng }) => {
          if (parcelClickGuardRef.current) {
            return;
          }

          clearSelectedParcel();
          clearSelectedDevelopmentProject();
          clearSelectedPlanningZone();
          moveMarker(latLng);
          setSelectedCoordinates(
            `${latLng.getLat().toFixed(6)}, ${latLng.getLng().toFixed(6)}`
          );
          setSearchMessage("");

          geocoderRef.current?.coord2Address(
            latLng.getLng(),
            latLng.getLat(),
            (result, status) => {
              if (status !== maps.services.Status.OK || !result[0]) {
                setSelectedAddress("선택한 위치의 주소를 찾지 못했습니다.");
                return;
              }

              const address =
                result[0].road_address?.address_name ??
                result[0].address?.address_name ??
                "주소 정보 없음";
              setSelectedAddress(address);
            }
          );
        };

        maps.event.addListener(map, "click", clickHandler);
        idleHandler = () => {
          if (idleTimer) {
            clearTimeout(idleTimer);
          }

          idleTimer = setTimeout(() => {
            refreshParcelsRef.current();
            refreshDevelopmentProjectsRef.current();
            refreshPlanningZonesRef.current();
            refreshPolicyZonesRef.current();
          }, 350);
        };
        maps.event.addListener(map, "idle", idleHandler);
        setMapStatus("ready");
      })
      .catch(() => {
        if (!disposed) {
          setMapStatus("error");
        }
      });

    return () => {
      disposed = true;

      if (clickHandler && mapsApiRef.current && mapRef.current) {
        mapsApiRef.current.event.removeListener(mapRef.current, "click", clickHandler);
      }

      if (idleHandler && mapsApiRef.current && mapRef.current) {
        mapsApiRef.current.event.removeListener(mapRef.current, "idle", idleHandler);
      }

      if (idleTimer) {
        clearTimeout(idleTimer);
      }

      parcelRequestRef.current?.abort();
      developmentRequestRef.current?.abort();
      planningRequestRef.current?.abort();
      landLedgerRequestRef.current?.abort();
      parcelPolygonsRef.current.forEach(({ clickHandler: polygonClickHandler, polygon }) => {
        mapsApiRef.current?.event.removeListener(polygon, "click", polygonClickHandler);
        polygon.setMap(null);
      });
      parcelPolygonsRef.current = [];
      selectedParcelPolygonsRef.current = [];
      developmentPolygonsRef.current.forEach(
        ({ clickHandler: polygonClickHandler, polygon }) => {
          mapsApiRef.current?.event.removeListener(polygon, "click", polygonClickHandler);
          polygon.setMap(null);
        }
      );
      developmentPolygonsRef.current = [];
      selectedDevelopmentPolygonsRef.current = [];
      planningPolygonsRef.current.forEach(
        ({ clickHandler: polygonClickHandler, polygon }) => {
          mapsApiRef.current?.event.removeListener(polygon, "click", polygonClickHandler);
          polygon.setMap(null);
        }
      );
      planningPolygonsRef.current = [];
      selectedPlanningPolygonsRef.current = [];
      policyRequestRef.current?.abort();
      policyPolygonsRef.current.forEach(
        ({ clickHandler: polygonClickHandler, polygon }) => {
          mapsApiRef.current?.event.removeListener(polygon, "click", polygonClickHandler);
          polygon.setMap(null);
        }
      );
      policyPolygonsRef.current = [];
      selectedPolicyPolygonsRef.current = [];
      // 라벨 오버레이는 DOM 리스너를 쓰므로 여기서 함께 해제한다.
      [...maintenanceMarkersRef.current, ...policyMarkersRef.current].forEach(
        ({ clickHandler: overlayClickHandler, element, overlay }) => {
          element.removeEventListener("click", overlayClickHandler);
          overlay.setMap(null);
        }
      );
      maintenanceMarkersRef.current = [];
      policyMarkersRef.current = [];
      parcelClickGuardRef.current = false;
      markerRef.current?.setMap(null);
    };
  }, [
    appKey,
    clearSelectedDevelopmentProject,
    clearSelectedParcel,
    clearSelectedPlanningZone
  ]);

  function handleParcelLayerToggle() {
    const nextEnabled = !parcelLayerEnabled;
    parcelLayerEnabledRef.current = nextEnabled;
    setParcelLayerEnabled(nextEnabled);

    if (!nextEnabled) {
      parcelRequestRef.current?.abort();
      clearParcelPolygons();
      setParcelStatus("idle");
      return;
    }

    void refreshParcels();
  }

  function handleDevelopmentLayerToggle() {
    const nextEnabled = !developmentLayerEnabled;
    developmentLayerEnabledRef.current = nextEnabled;
    setDevelopmentLayerEnabled(nextEnabled);

    if (!nextEnabled) {
      developmentRequestRef.current?.abort();
      clearDevelopmentPolygons();
      setDevelopmentStatus("idle");
      return;
    }

    void refreshDevelopmentProjects();
  }

  function handlePlanningLayerToggle() {
    const nextEnabled = !planningLayerEnabled;
    planningLayerEnabledRef.current = nextEnabled;
    setPlanningLayerEnabled(nextEnabled);

    if (!nextEnabled) {
      planningRequestRef.current?.abort();
      clearPlanningPolygons();
      setPlanningStatus("idle");
      return;
    }

    void refreshPlanningZones();
  }

  function handlePolicyLayerToggle() {
    const nextEnabled = !policyLayerEnabled;
    policyLayerEnabledRef.current = nextEnabled;
    setPolicyLayerEnabled(nextEnabled);

    if (!nextEnabled) {
      policyRequestRef.current?.abort();
      clearPolicyZones();
      setPolicyStatus("idle");
      // 중복 억제가 풀렸으니 가려져 있던 이정표를 되살린다.
      void refreshPlanningZones();
      return;
    }

    void refreshPolicyZones().then(() => {
      // 이 레이어가 세운 이정표와 겹치는 라벨을 정리한다.
      void refreshPlanningZones();
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    const places = placesRef.current;

    if (!trimmedQuery || !maps || !map || !places) {
      return;
    }

    setSearchMessage("검색 중입니다.");
    clearSelectedParcel();
    clearSelectedDevelopmentProject();
    clearSelectedPlanningZone();

    places.keywordSearch(trimmedQuery, (result, status) => {
      if (status !== maps.services.Status.OK || !result[0]) {
        setSearchMessage("검색 결과가 없습니다. 지번 또는 도로명 주소로 다시 입력해 주세요.");
        return;
      }

      const first = result[0];
      const position = new maps.LatLng(Number(first.y), Number(first.x));
      const address = first.road_address_name || first.address_name || first.place_name;

      map.setCenter(position);
      map.setLevel(4);
      moveMarker(position);
      setSelectedAddress(address);
      setSelectedCoordinates(`${Number(first.y).toFixed(6)}, ${Number(first.x).toFixed(6)}`);
      setSearchMessage(`${first.place_name || address}(으)로 이동했습니다.`);
    });
  }

  const showMapError = mapStatus === "missing-key" || mapStatus === "error";

  const parcelStatusMessage = {
    idle: "필지 경계를 표시할 수 있습니다.",
    loading: "현재 지도 영역의 필지를 불러오는 중입니다.",
    ready:
      parcelCount > 0
        ? `필지 경계 ${parcelCount.toLocaleString("ko-KR")}개를 표시했습니다. 주황색 필지 안쪽을 클릭해 보세요.`
        : "현재 영역에서 필지 경계를 찾지 못했습니다.",
    "zoom-in": "지도를 더 확대하면 필지 경계가 표시됩니다.",
    "not-configured": "VWorld API 키와 등록 도메인 설정이 필요합니다.",
    error: "필지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } satisfies Record<ParcelStatus, string>;

  const developmentStatusMessage = {
    idle: "공공주택·도심복합지구 경계를 표시할 수 있습니다.",
    loading: "현재 지도 영역의 공공주택·도심복합지구를 불러오는 중입니다.",
    ready:
      developmentCount > 0
        ? `공공주택·도심복합지구 ${developmentCount.toLocaleString("ko-KR")}개를 표시했습니다.${
            developmentTruncated ? " 더 확대하면 모든 구역을 확인할 수 있습니다." : ""
          } 보라색 구역을 클릭해 보세요.`
        : "현재 영역에서 공공주택·도심복합지구를 찾지 못했습니다.",
    "zoom-in": "수도권 지역을 더 확대하면 공공주택·도심복합지구가 표시됩니다.",
    error: "공공주택·도심복합지구 경계를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } satisfies Record<DevelopmentStatus, string>;

  const planningTotal = Object.values(planningCounts).reduce(
    (total, count) => total + count,
    0
  ) + maintenancePointCount;
  const planningStatusMessage = {
    idle: "정비·개발사업 구역과 서울·인천 공식 추진현황을 표시할 수 있습니다.",
    loading: "현재 지도 영역의 개발계획 구역을 불러오는 중입니다.",
    ready:
      planningTotal > 0
        ? `정비경계 ${planningCounts.maintenance.toLocaleString("ko-KR")} · 공식 추진현황 ${maintenancePointCount.toLocaleString("ko-KR")} · 도시개발 ${planningCounts[
            "urban-development"
          ].toLocaleString("ko-KR")} · 택지개발 ${planningCounts[
            "housing-site"
          ].toLocaleString("ko-KR")}개를 표시했습니다.${
            planningTruncated ? " 일부 구역은 더 확대해 확인해 주세요." : ""
          }`
        : "현재 영역에서 정비·개발계획 구역을 찾지 못했습니다.",
    "zoom-in": "수도권 지역을 더 확대하면 정비·개발계획 구역이 표시됩니다.",
    "not-configured": "VWorld API 키와 등록 도메인 설정이 필요합니다.",
    error: "정비·개발계획 구역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } satisfies Record<PlanningStatus, string>;
  const policyTotal = Object.values(policyCounts).reduce(
    (total, count) => total + count,
    0
  );
  const policyStatusMessage = {
    idle: "서울시 재개발·재건축·신속통합·모아타운 구역을 표시할 수 있습니다.",
    loading: "현재 지도 영역의 정비사업 구역을 불러오는 중입니다.",
    ready:
      policyTotal > 0
        ? `${(
            [
              "redevelopment",
              "reconstruction",
              "fast-track",
              "moa-town",
              "small-scale",
              "promotion",
              "residential"
            ] as ProjectZoneCategory[]
          )
            .filter((category) => policyCounts[category] > 0)
            .map(
              (category) =>
                `${PROJECT_ZONE_CATEGORY_LABELS[category]} ${policyCounts[
                  category
                ].toLocaleString("ko-KR")}`
            )
            .join(" · ")}개 구역을 표시했습니다.`
        : "현재 영역에서 서울 정비사업 구역을 찾지 못했습니다.",
    "zoom-in": "서울 지역을 더 확대하면 정비사업 구역이 표시됩니다.",
    error: "정비사업 구역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
  } satisfies Record<PolicyStatus, string>;
  const selectedProgramLabels = selectedPlanningZone
    ? programTagLabels([
        ...new Set([
          ...(selectedPlanningZone.programTags ?? []),
          ...(maintenanceProjectDetail?.programTags ?? [])
        ])
      ])
    : [];

  return (
    <div className="map-page">
      <header className="map-toolbar">
        <div className="map-toolbar__lead">
          <Link aria-label="땅뷰 홈으로 돌아가기" className="map-toolbar__brand" href="/">
            <span className="brand-mark__symbol">
              <Map aria-hidden="true" size={19} />
            </span>
            <span>땅뷰</span>
          </Link>
          <Link className="map-toolbar__intro" href="/about">
            소개
          </Link>
        </div>

        <form className="map-search" onSubmit={handleSearch}>
          <Search aria-hidden="true" size={19} />
          <label className="sr-only" htmlFor="map-search-input">
            주소 또는 장소 검색
          </label>
          <input
            disabled={mapStatus !== "ready"}
            id="map-search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="주소 또는 장소를 검색하세요"
            type="search"
            value={query}
          />
          <button disabled={mapStatus !== "ready" || !query.trim()} type="submit">
            검색
          </button>
        </form>

        <div className="map-toolbar__actions">
          {currentUser ? (
            <>
              <Button href="/account" size="sm" variant="secondary">
                {currentUser.nickname}님
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button href="/login?next=/" size="sm" variant="ghost">
                로그인
              </Button>
              <Button href="/signup" size="sm">
                회원가입
              </Button>
            </>
          )}
          <ContactButton size="sm" variant="secondary">
            문의하기
          </ContactButton>
        </div>
      </header>

      <main className="map-workspace">
        <aside className="map-sidebar">
          <div className="map-sidebar__heading">
            <p className="eyebrow">지도 탐색</p>
            <h1>관심 지역을 선택하세요</h1>
            <p>필지를 선택하면 토지 정보를 이 패널에서 확인할 수 있습니다.</p>
          </div>

          <section className="map-selection" aria-live="polite">
            <div className="map-selection__icon">
              <MapPin aria-hidden="true" size={20} />
            </div>
            <div>
              <span>선택 위치</span>
              <strong>{selectedAddress}</strong>
              {selectedCoordinates ? <small>{selectedCoordinates}</small> : null}
            </div>
          </section>

          {selectedPlanningZone ? (
            <section
              aria-live="polite"
              className={`parcel-detail planning-detail planning-detail--${selectedPlanningZone.category}`}
              ref={planningDetailRef}
            >
              <div className="parcel-detail__header">
                <div>
                  <span>선택 개발계획 구역</span>
                  <h2>{selectedPlanningZone.projectName}</h2>
                </div>
                <span className="parcel-detail__source planning-detail__source">
                  {selectedPlanningZone.projectType}
                </span>
              </div>

              {selectedProgramLabels.length > 0 ? (
                <div aria-label="정책·사업 태그" className="project-program-tags">
                  {selectedProgramLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              ) : null}

              <dl className="parcel-detail__list">
                <div>
                  <dt>구역 유형</dt>
                  <dd>{selectedPlanningZone.projectType}</dd>
                </div>
                <div>
                  <dt>지역</dt>
                  <dd>{selectedPlanningZone.regionName || "-"}</dd>
                </div>
                <div>
                  <dt>사업 면적</dt>
                  <dd>
                    {selectedPlanningZone.areaSquareMeters
                      ? formatAreaWithPyeong(selectedPlanningZone.areaSquareMeters)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>분류</dt>
                  <dd>{selectedPlanningZone.classification || "-"}</dd>
                </div>
                <div>
                  <dt>집행 구분</dt>
                  <dd>{selectedPlanningZone.statusName || "-"}</dd>
                </div>
                <div>
                  <dt>행정구역 코드</dt>
                  <dd>{selectedPlanningZone.districtCode || "-"}</dd>
                </div>
                <div>
                  <dt>고시 식별자</dt>
                  <dd>{selectedPlanningZone.noticeId || "-"}</dd>
                </div>
              </dl>

              {selectedPlanningZone.category === "maintenance" &&
              (maintenanceProjectDetail ||
                selectedPlanningZone.districtCode.startsWith("28")) ? (
                <div
                  aria-busy={maintenanceMatchStatus === "loading"}
                  className="maintenance-official"
                >
                  <div className="maintenance-official__heading">
                    <strong>
                      {maintenanceProjectDetail?.sourceProvider ?? "인천광역시"} 공식
                      추진현황
                    </strong>
                    {maintenanceProjectDetail ? (
                      <span>{maintenanceProjectDetail.sourceBaseDate} 기준</span>
                    ) : null}
                  </div>

                  {maintenanceMatchStatus === "loading" ? (
                    <p>공식 정비사업 자료와 구역명을 대조하고 있습니다.</p>
                  ) : null}

                  {maintenanceMatchStatus === "not-found" ? (
                    <p>
                      현재 공식 추진현황 파일에서 유일하게 일치하는 사업을 찾지 못했습니다.
                      구역이 없다는 의미는 아니며 공식 고시를 함께 확인해 주세요.
                    </p>
                  ) : null}

                  {maintenanceMatchStatus === "error" ? (
                    <p>공식 추진현황을 불러오지 못했습니다. 잠시 후 다시 선택해 주세요.</p>
                  ) : null}

                  {maintenanceProjectDetail ? (
                    <>
                      <dl className="parcel-detail__list maintenance-official__list">
                        <div>
                          <dt>공식 사업명</dt>
                          <dd>{maintenanceProjectDetail.projectName}</dd>
                        </div>
                        <div>
                          <dt>사업 유형</dt>
                          <dd>{maintenanceProjectDetail.projectType}</dd>
                        </div>
                        <div>
                          <dt>추진 단계</dt>
                          <dd>{maintenanceProjectDetail.businessStage}</dd>
                        </div>
                        {maintenanceProjectDetail.rawStage &&
                        maintenanceProjectDetail.rawStage !==
                          maintenanceProjectDetail.businessStage ? (
                          <div>
                            <dt>원문 단계</dt>
                            <dd>{maintenanceProjectDetail.rawStage}</dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>위치</dt>
                          <dd>
                            {[
                              maintenanceProjectDetail.districtName,
                              maintenanceProjectDetail.location
                            ]
                              .filter(Boolean)
                              .join(" ") || "-"}
                          </dd>
                        </div>
                        <div>
                          <dt>공식 면적</dt>
                          <dd>
                            {maintenanceProjectDetail.areaSquareMeters
                              ? formatAreaWithPyeong(
                                  maintenanceProjectDetail.areaSquareMeters
                                )
                              : "-"}
                          </dd>
                        </div>
                        {maintenanceProjectDetail.details.publicPrivate ? (
                          <div>
                            <dt>시행 구분</dt>
                            <dd>{maintenanceProjectDetail.details.publicPrivate}</dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.districtType ? (
                          <div>
                            <dt>구역 구분</dt>
                            <dd>{maintenanceProjectDetail.details.districtType}</dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.existingHouseholds != null ? (
                          <div>
                            <dt>기존 세대수</dt>
                            <dd>
                              {maintenanceProjectDetail.details.existingHouseholds.toLocaleString(
                                "ko-KR"
                              )}
                              세대
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.plannedHouseholds != null ? (
                          <div>
                            <dt>계획 세대수</dt>
                            <dd>
                              {maintenanceProjectDetail.details.plannedHouseholds.toLocaleString(
                                "ko-KR"
                              )}
                              세대
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.plannedSaleHouseholds != null ? (
                          <div>
                            <dt>분양 계획</dt>
                            <dd>
                              {maintenanceProjectDetail.details.plannedSaleHouseholds.toLocaleString(
                                "ko-KR"
                              )}
                              세대
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.plannedRentalHouseholds != null ? (
                          <div>
                            <dt>임대 계획</dt>
                            <dd>
                              {maintenanceProjectDetail.details.plannedRentalHouseholds.toLocaleString(
                                "ko-KR"
                              )}
                              세대
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.memberCount != null ? (
                          <div>
                            <dt>조합원 수</dt>
                            <dd>
                              {maintenanceProjectDetail.details.memberCount.toLocaleString(
                                "ko-KR"
                              )}
                              명
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.ownerCount != null ? (
                          <div>
                            <dt>소유자 수</dt>
                            <dd>
                              {maintenanceProjectDetail.details.ownerCount.toLocaleString(
                                "ko-KR"
                              )}
                              명
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.architecturalReviewDate ? (
                          <div>
                            <dt>건축심의</dt>
                            <dd>
                              {maintenanceProjectDetail.details.architecturalReviewDate}
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.districtDesignationDate ? (
                          <div>
                            <dt>구역 지정</dt>
                            <dd>
                              {maintenanceProjectDetail.details.districtDesignationDate}
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.committeeApprovalDate ? (
                          <div>
                            <dt>추진위원회 승인</dt>
                            <dd>
                              {maintenanceProjectDetail.details.committeeApprovalDate}
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.associationApprovalDate ? (
                          <div>
                            <dt>조합설립인가</dt>
                            <dd>
                              {maintenanceProjectDetail.details.associationApprovalDate}
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.implementationApprovalDate ? (
                          <div>
                            <dt>사업시행인가</dt>
                            <dd>
                              {
                                maintenanceProjectDetail.details
                                  .implementationApprovalDate
                              }
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.managementDispositionDate ? (
                          <div>
                            <dt>관리처분인가</dt>
                            <dd>
                              {
                                maintenanceProjectDetail.details
                                  .managementDispositionDate
                              }
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.constructionStartDate ? (
                          <div>
                            <dt>착공일</dt>
                            <dd>
                              {maintenanceProjectDetail.details.constructionStartDate}
                            </dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.relocationStartDate ? (
                          <div>
                            <dt>이주 시작</dt>
                            <dd>{maintenanceProjectDetail.details.relocationStartDate}</dd>
                          </div>
                        ) : null}
                        {maintenanceProjectDetail.details.relocationEndDate ? (
                          <div>
                            <dt>이주 종료</dt>
                            <dd>{maintenanceProjectDetail.details.relocationEndDate}</dd>
                          </div>
                        ) : null}
                      </dl>
                      {maintenanceProjectDetail.details.note ? (
                        <p className="maintenance-official__note">
                          {maintenanceProjectDetail.details.note}
                        </p>
                      ) : null}
                      <a
                        className="maintenance-official__link"
                        href={maintenanceProjectDetail.officialUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        공식 원본 데이터 확인
                      </a>
                    </>
                  ) : null}
                </div>
              ) : null}

              <p className="parcel-detail__notice">
                <Info aria-hidden="true" size={15} />
                국토교통부 VWorld 도시계획 공간정보에서 구역명으로 선별한 자료입니다.
                사업 단계와 최신 법적 효력은 관할 기관의 고시문을 확인해 주세요.
              </p>
            </section>
          ) : null}

          {selectedPolicyZone ? (
            <section aria-live="polite" className="parcel-detail policy-detail">
              <div className="parcel-detail__header">
                <div>
                  <p className="eyebrow">선택 정비사업 구역</p>
                  <h2>{selectedPolicyZone.projectName}</h2>
                </div>
                <div className="parcel-detail__tags">
                  <span className="parcel-detail__tag">
                    {selectedPolicyZone.projectType}
                  </span>
                  {selectedPolicyZone.stageName ? (
                    <span className="parcel-detail__tag">
                      {selectedPolicyZone.stageName}
                    </span>
                  ) : null}
                </div>
              </div>

              <dl className="parcel-detail__list">
                <div>
                  <dt>사업 유형</dt>
                  <dd>{selectedPolicyZone.projectType}</dd>
                </div>
                <div>
                  <dt>추진 단계</dt>
                  <dd>{selectedPolicyZone.stageName || "-"}</dd>
                </div>
                <div>
                  <dt>지역</dt>
                  <dd>{selectedPolicyZone.regionName || "-"}</dd>
                </div>
                <div>
                  <dt>구역 면적</dt>
                  <dd>
                    {selectedPolicyZone.areaSquareMeters
                      ? formatAreaWithPyeong(selectedPolicyZone.areaSquareMeters)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>고시일</dt>
                  <dd>{selectedPolicyZone.noticeDate || "-"}</dd>
                </div>
                <div>
                  <dt>자료 기준일</dt>
                  <dd>{policySource?.sourceBaseDate || "-"}</dd>
                </div>
              </dl>

              <a
                className="maintenance-official__link"
                href={
                  policySource?.sourceUrl ??
                  "https://data.seoul.go.kr/dataList/OA-22712/F/1/datasetView.do"
                }
                rel="noreferrer"
                target="_blank"
              >
                서울플랜+ 원본 데이터 보기 ↗
              </a>

              <p className="parcel-detail__notice">
                <Info aria-hidden="true" size={15} />
                {policySource?.sourceName} ({policySource?.sourceLicense}). 법적
                효력이 없는 참고 자료이며, 최신 추진 단계는 관할 자치구 고시를 확인해
                주세요.
              </p>
            </section>
          ) : null}

          {selectedDevelopmentProject ? (
            <section
              aria-live="polite"
              className="parcel-detail development-detail"
              ref={developmentDetailRef}
            >
              <div className="parcel-detail__header">
                <div>
                  <span>선택 공공주택·도심복합지구</span>
                  <h2>{developmentProjectDisplayName(selectedDevelopmentProject)}</h2>
                </div>
                <span className="parcel-detail__source development-detail__source">
                  공식정보
                </span>
              </div>

              <dl className="parcel-detail__list">
                <div>
                  <dt>사업 유형</dt>
                  <dd>{selectedDevelopmentProject.projectType}</dd>
                </div>
                <div>
                  <dt>지역</dt>
                  <dd>{selectedDevelopmentProject.regionName}</dd>
                </div>
                <div>
                  <dt>사업 면적</dt>
                  <dd>
                    {selectedDevelopmentProject.areaSquareMeters
                      ? formatAreaWithPyeong(selectedDevelopmentProject.areaSquareMeters)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>고시일</dt>
                  <dd>{selectedDevelopmentProject.noticeDate || "-"}</dd>
                </div>
                <div>
                  <dt>행정구역 코드</dt>
                  <dd>{selectedDevelopmentProject.districtCode || "-"}</dd>
                </div>
                <div>
                  <dt>고시 식별자</dt>
                  <dd>{selectedDevelopmentProject.noticeId || "-"}</dd>
                </div>
                {selectedDevelopmentProject.remark ? (
                  <div>
                    <dt>비고</dt>
                    <dd>{selectedDevelopmentProject.remark}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>자료 기준</dt>
                  <dd>{selectedDevelopmentProject.sourceBaseDate || "2026-07"}</dd>
                </div>
              </dl>

              <p className="parcel-detail__notice">
                <Info aria-hidden="true" size={15} />
                국토교통부 공공주택지구 공간파일을 웹용으로 변환한 자료입니다. 최신
                법적 효력과 사업 단계는 해당 고시문을 확인해 주세요.
              </p>
            </section>
          ) : null}

          {selectedParcel ? (
            <section
              aria-busy={landLedgerStatus === "loading"}
              aria-live="polite"
              className="parcel-detail"
              ref={parcelDetailRef}
            >
              <div className="parcel-detail__header">
                <div>
                  <span>선택 필지</span>
                  <h2>{selectedParcel.address || selectedParcel.jibun || "필지 정보"}</h2>
                </div>
                <span className="parcel-detail__source">VWorld</span>
              </div>

              <dl className="parcel-detail__list">
                <div>
                  <dt>지번</dt>
                  <dd>{selectedParcel.jibun || "-"}</dd>
                </div>
                <div>
                  <dt>본번 / 부번</dt>
                  <dd>
                    {selectedParcel.bonbun || "-"} / {selectedParcel.bubun || "-"}
                  </dd>
                </div>
                <div>
                  <dt>PNU</dt>
                  <dd className="parcel-detail__pnu">{selectedParcel.pnu || "-"}</dd>
                </div>
                <div>
                  <dt>개별공시지가</dt>
                  <dd>
                    {selectedParcel.officialPrice
                      ? `${selectedParcel.officialPrice.toLocaleString("ko-KR")}원/㎡`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>토지대장 면적</dt>
                  <dd>
                    {landLedgerStatus === "loading"
                      ? "조회 중..."
                      : landLedger
                        ? formatAreaWithPyeong(landLedger.areaSquareMeters)
                        : landLedgerStatus === "not-found"
                          ? "대장 정보 없음"
                          : landLedgerStatus === "error"
                            ? "조회 실패"
                            : "-"}
                  </dd>
                </div>
                {landLedger ? (
                  <>
                    <div>
                      <dt>지목</dt>
                      <dd>{landLedger.landCategory || "-"}</dd>
                    </div>
                    <div>
                      <dt>대장 구분</dt>
                      <dd>{landLedger.registerType || "-"}</dd>
                    </div>
                    <div>
                      <dt>대장 갱신일</dt>
                      <dd>{landLedger.lastUpdatedDate || "-"}</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt>경계 추정 면적</dt>
                  <dd>
                    {selectedParcel.areaSquareMeters
                      ? formatAreaWithPyeong(selectedParcel.areaSquareMeters)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>가격 기준</dt>
                  <dd>
                    {selectedParcel.referenceYear
                      ? `${selectedParcel.referenceYear}년${
                          selectedParcel.referenceMonth
                            ? ` ${Number(selectedParcel.referenceMonth)}월`
                            : ""
                        }`
                      : "-"}
                  </dd>
                </div>
              </dl>

              <p className="parcel-detail__notice">
                <Info aria-hidden="true" size={15} />
                토지대장 면적은 VWorld 토지·임야 속성정보 기준입니다. 증명용 자료는
                발급된 토지대장을 확인하고, 경계 추정 면적은 참고용으로 사용해 주세요.
              </p>
            </section>
          ) : null}

          {searchMessage ? (
            <p className="map-search-message" role="status">
              {searchMessage}
            </p>
          ) : null}

          <button
            aria-pressed={parcelLayerEnabled}
            className={`map-layer-preview${parcelLayerEnabled ? " map-layer-preview--active" : ""}`}
            disabled={mapStatus !== "ready"}
            onClick={handleParcelLayerToggle}
            type="button"
          >
            <div>
              <Layers3 aria-hidden="true" size={18} />
              <span>연속지적도</span>
            </div>
            <span className="map-layer-preview__status">
              {parcelLayerEnabled ? "켜짐" : "꺼짐"}
            </span>
          </button>

          <p
            className={`map-layer-message map-layer-message--${parcelStatus}`}
            role="status"
          >
            {parcelStatusMessage[parcelStatus]}
          </p>

          <button
            aria-pressed={developmentLayerEnabled}
            className={`map-layer-preview map-layer-preview--development${
              developmentLayerEnabled ? " map-layer-preview--active" : ""
            }`}
            disabled={mapStatus !== "ready"}
            onClick={handleDevelopmentLayerToggle}
            type="button"
          >
            <div>
              <Building2 aria-hidden="true" size={18} />
              <span>공공주택·도심복합지구</span>
            </div>
            <span className="map-layer-preview__status">
              {developmentLayerEnabled ? "켜짐" : "꺼짐"}
            </span>
          </button>

          <p
            className={`map-layer-message map-layer-message--${developmentStatus}`}
            role="status"
          >
            {developmentStatusMessage[developmentStatus]}
          </p>

          <button
            aria-pressed={planningLayerEnabled}
            className={`map-layer-preview map-layer-preview--planning${
              planningLayerEnabled ? " map-layer-preview--active" : ""
            }`}
            disabled={mapStatus !== "ready"}
            onClick={handlePlanningLayerToggle}
            type="button"
          >
            <div>
              <MapPin aria-hidden="true" size={18} />
              <span>정비·개발사업</span>
            </div>
            <span className="map-layer-preview__status">
              {planningLayerEnabled ? "켜짐" : "꺼짐"}
            </span>
          </button>

          <div aria-label="개발계획 구역 색상" className="planning-legend">
            <span><i className="planning-legend__swatch planning-legend__swatch--maintenance" />정비 구역·위치</span>
            <span><i className="planning-legend__swatch planning-legend__swatch--urban" />도시개발</span>
            <span><i className="planning-legend__swatch planning-legend__swatch--housing" />택지개발</span>
          </div>

          <p
            className={`map-layer-message map-layer-message--${planningStatus}`}
            role="status"
          >
            {planningStatusMessage[planningStatus]}
          </p>

          <button
            aria-pressed={policyLayerEnabled}
            className={`map-layer-preview map-layer-preview--policy${
              policyLayerEnabled ? " map-layer-preview--active" : ""
            }`}
            disabled={mapStatus !== "ready"}
            onClick={handlePolicyLayerToggle}
            type="button"
          >
            <div>
              <Sparkles aria-hidden="true" size={18} />
              <span>서울 정비사업 구역</span>
            </div>
            <span className="map-layer-preview__status">
              {policyLayerEnabled ? "켜짐" : "꺼짐"}
            </span>
          </button>

          <div aria-label="서울 정비사업 구역 색상" className="planning-legend">
            {(
              [
                "redevelopment",
                "reconstruction",
                "fast-track",
                "moa-town",
                "small-scale",
                "promotion",
                "residential"
              ] as ProjectZoneCategory[]
            ).map((category) => (
              <span key={category}>
                <i
                  className={`planning-legend__swatch planning-legend__swatch--zone-${category}`}
                />
                {PROJECT_ZONE_CATEGORY_LABELS[category]}
              </span>
            ))}
          </div>

          <p
            className={`map-layer-message map-layer-message--${policyStatus}`}
            role="status"
          >
            {policyStatusMessage[policyStatus]}
          </p>

          {policySourceNote ? (
            <p className="map-layer-source-note">
              출처: {policySourceNote}. 공공누리 제4유형(출처표시·상업적이용금지·변경금지)
              자료로 비상업 목적의 지도 표시에만 사용합니다. 법적 효력이 없는 참고
              자료이며 최신 내용은 공식 원문으로 확인해 주세요.
            </p>
          ) : null}

          <section aria-labelledby="official-policy-title" className="official-policy-sources">
            <div className="official-policy-sources__heading">
              <Database aria-hidden="true" size={17} />
              <h2 id="official-policy-title">정책사업 공식 현황</h2>
            </div>
            <div className="official-policy-sources__list">
              {OFFICIAL_POLICY_SOURCES.map((source) => (
                <a href={source.url} key={source.name} rel="noreferrer" target="_blank">
                  <strong>{source.name}</strong>
                  <span>{source.summary}</span>
                  <small>공식 원문 보기 ↗</small>
                </a>
              ))}
            </div>
            <p>
              서울 정비사업 구역(재개발·재건축·신속통합기획·모아타운 등)은 서울플랜+
              공간정보(공공누리 제4유형)를 비상업 목적으로 지도에 표시합니다. 집계
              건수와 최신 단계는 위 공식 원문이 기준이며, 지도 표시는 참고 자료입니다.
            </p>
          </section>

          <div className="map-coming-soon">
            <div>
              <Database aria-hidden="true" size={17} />
              <span>실거래가</span>
            </div>
            <div>
              <ShieldCheck aria-hidden="true" size={17} />
              <span>용도지역·규제</span>
            </div>
          </div>

          <p className="map-sidebar__notice">
            후보지와 법정 지정구역은 성격이 다릅니다. 계약·투자 판단 전에는
            반드시 관할 기관의 최신 고시를 확인해 주세요.
          </p>
        </aside>

        <section className="map-canvas" aria-label="카카오 지도">
          <div className="map-canvas__surface" ref={mapContainerRef} />

          {mapStatus === "loading" ? (
            <div className="map-state-card" role="status">
              <span className="map-loader" />
              <strong>지도를 불러오고 있습니다</strong>
              <p>카카오 지도 SDK 연결을 확인하는 중입니다.</p>
            </div>
          ) : null}

          {showMapError ? (
            <div className="map-state-card map-state-card--error" role="alert">
              <span className="map-state-card__icon">
                <TriangleAlert aria-hidden="true" size={24} />
              </span>
              <strong>
                {mapStatus === "missing-key"
                  ? "카카오 지도 키가 필요합니다"
                  : "카카오 지도를 불러오지 못했습니다"}
              </strong>
              <p>
                {mapStatus === "missing-key"
                  ? "로컬 .env와 Vercel 환경변수에 NEXT_PUBLIC_KAKAO_MAP_APP_KEY를 설정해 주세요."
                  : "JavaScript 키와 허용 도메인 설정을 확인한 뒤 페이지를 새로고침해 주세요."}
              </p>
              <code>NEXT_PUBLIC_KAKAO_MAP_APP_KEY=...</code>
            </div>
          ) : null}

          <div className="map-source-badge">
            {developmentLayerEnabled ? "공공주택·도심복합지구 © 국토교통부 · " : ""}
            {planningLayerEnabled ? "정비·개발계획 © VWorld · " : ""}
            {policyLayerEnabled ? "서울 정비사업 구역 © 서울특별시 서울플랜+ · " : ""}
            {parcelLayerEnabled ? "필지 © VWorld · " : ""}
            지도 © Kakao
          </div>
        </section>
      </main>
    </div>
  );
}
