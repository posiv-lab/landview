# DDANGVIEW Next.js 구현 계획

## 1. 목표

`prd.md`의 땅뷰 랜딩페이지 요구사항을 기준으로, `_ds/gangnamunni-design-system-*`의 토큰과 UI 규칙을 차용한 Next.js 기반 반응형 랜딩페이지를 구현한다.

핵심 결과물은 첫 화면에서 "지역별 토지 정보 조회 서비스"라는 정체성과 주요 CTA가 5초 안에 이해되는 모바일 우선 웹 페이지다.

## 2. 기준 자료

- `prd.md`: 서비스 포지셔닝, 페이지 구조, CTA, 카피, SEO, 전환, 컴플라이언스 기준.
- `_ds/.../styles.css`: 디자인 시스템 루트 스타일.
- `_ds/.../tokens/colors.css`: orange 브랜드 컬러, bluegray 중립색, status 컬러.
- `_ds/.../tokens/typography.css`: Pretendard 기반 폰트, 크기, 굵기 토큰.
- `_ds/.../tokens/spacing.css`: 8px 기반 spacing, radius, motion, shadow 토큰.
- `_ds/.../_ds_manifest.json`, `_ds_bundle.js`: Badge, Card, Table, Button, Input, Tabs, Dialog 패턴 참고.

## 3. 구현 원칙

- 땅뷰는 투자 추천 서비스가 아니라 토지 정보 조회 서비스로 표현한다.
- 수익 보장, 급등, 확정 호재, 매수 추천, 100% 정확, 실시간 같은 문구를 사용하지 않는다.
- 매물 호가 기능은 데이터 확보가 확정되기 전까지 제공 기능으로 노출하지 않는다.
- 데이터 출처, 기준 시점, 정보 이용 유의사항을 페이지 안에서 명확히 보여준다.
- `_ds`의 원 브랜드명과 로고를 사용하지 않고, 땅뷰 텍스트 로고와 토지/지도 도메인에 맞는 UI 목업으로 치환한다.
- 그림자와 화려한 장식을 줄이고, 헤어라인 보더, 밝은 표면, 차분한 데이터 패널 중심으로 구성한다.
- 모바일 우선으로 설계하고, 모든 CTA와 입력 요소는 최소 44px 이상의 터치 영역을 확보한다.

## 4. 기술 스택

- Framework: Next.js App Router.
- Language: TypeScript.
- Styling: CSS Modules 또는 `app/globals.css` + 컴포넌트별 CSS Module.
- Font: `_ds` 기준 Pretendard 계열. 초기에는 CDN import를 사용하고, 추후 폰트 파일 확보 시 self-hosting으로 전환한다.
- Icons: 필요한 경우 `lucide-react`의 일반 UI 아이콘만 사용한다. 브랜드 로고나 고유 아이콘은 임의 제작하지 않는다.
- Form: 초기 버전은 클라이언트 유효성 검사와 mock submit 상태까지만 구현한다. 실제 리드 저장 API는 별도 연동 항목으로 남긴다.
- Deployment target: 정적 랜딩페이지 배포가 가능한 Vercel 또는 Node 호스팅.

## 5. 프로젝트 구조

```text
landview/
  app/
    layout.tsx
    page.tsx
    globals.css
    privacy/page.tsx
    terms/page.tsx
    info-disclaimer/page.tsx
  src/
    components/
      layout/
        Header.tsx
        Footer.tsx
        MobileStickyCta.tsx
      sections/
        HeroSection.tsx
        ProblemSection.tsx
        SolutionSection.tsx
        FeatureSection.tsx
        DataTrustSection.tsx
        InfoChecklistSection.tsx
        FlowSection.tsx
        UseCaseSection.tsx
        FaqSection.tsx
        FinalCtaSection.tsx
      ui/
        Button.tsx
        Card.tsx
        Badge.tsx
        SearchBox.tsx
        LeadForm.tsx
        Accordion.tsx
        DataTable.tsx
      mockups/
        MapMockup.tsx
        ParcelPanelMockup.tsx
        CompareTableMockup.tsx
    data/
      landingContent.ts
      faq.ts
    styles/
      tokens/
        colors.css
        typography.css
        spacing.css
```

## 6. 디자인 시스템 적용 계획

1. `_ds`의 `tokens/*.css`를 `src/styles/tokens/`로 복사한다.
2. `app/globals.css`에서 토큰을 import하고 기본 body, link, focus 스타일을 정의한다.
3. `Button`, `Card`, `Badge`, `Input/SearchBox`, `DataTable`은 `_ds_bundle.js`의 패턴을 React/TypeScript 컴포넌트로 재작성한다.
4. 색상은 `bluegray` 중립색을 기본으로 사용하고, CTA와 일부 상태 강조에만 `orange` 계열을 제한적으로 사용한다.
5. 카드와 패널은 `1px solid var(--border-default)`, `var(--radius-300)`, `box-shadow: none`을 기본값으로 둔다.
6. 지도 목업과 데이터 패널은 실제 지도 서비스를 연상시키되, 과장된 투자 광고처럼 보이지 않도록 차분한 정보 UI로 구성한다.
7. 모션은 150~250ms 범위의 단순 transition만 사용하고, bounce/spring/scale 효과는 사용하지 않는다.

## 7. 페이지 섹션 구현 계획

### 7.1 Header

- 좌측: 텍스트 로고 `땅뷰`.
- 우측: `주요 기능`, `데이터 출처`, `FAQ`, `출시 알림` 앵커 링크.
- 모바일: 간결한 헤더와 주요 CTA 버튼 유지.

### 7.2 Hero

- H1: `우리 동네 땅 정보, 한 화면에서 확인하세요`.
- 서브 카피: 실거래가, 공시지가, 용도지역, 규제 정보의 통합 조회 강조.
- 지역 검색창: 예시 placeholder `예: 경기 양평군, 제주 한림읍`.
- CTA: `우리 동네 땅값 확인하기`, 보조 CTA `출시 알림 받기`.
- 비주얼: 지도 위 필지 경계, 실거래 패널, 공시지가 요약 패널을 포함한 고품질 UI 목업.
- 신뢰 문구: 공공 데이터 기반 조회 서비스이며 참고 자료임을 명시.

### 7.3 Problem

- 3~4개 카드:
  - 사이트를 여러 번 오가야 하는 문제.
  - 토지 용어가 어려운 문제.
  - 아파트와 달리 토지 시세 비교가 어려운 문제.
  - 공공 사이트의 탐색성이 낮은 문제.

### 7.4 Solution / Features

- 핵심 기능 카드와 목업을 함께 배치한다.
- 포함 기능:
  - 지역별 토지 탐색.
  - 실거래가 조회.
  - 공시지가 및 가격 흐름.
  - 필지 기본 정보 요약.
  - 토지이용계획·규제 확인.
  - 관심 지역 저장 및 비교.
- 숫자, 면적, 가격 예시는 정확한 형태로 표기하되 실제 데이터처럼 오인되지 않도록 `예시` 라벨을 붙인다.

### 7.5 Data Trust

- 공공 데이터 기반, 출처 표기, 기준 시점 표시, 갱신 주기 차이를 안내한다.
- 기관명은 연동 확정 전에는 후보로만 내부 관리하고, 페이지 문구에서는 일반화된 표현을 사용한다.
- `100% 정확`, `실시간` 표현은 금지한다.

### 7.6 Info Checklist

- 토지 확인 항목을 checklist 또는 상태 badge로 표시한다.
- 상태 예시: `확인 완료`, `확인 필요`, `비교 필요`.
- 경고성 빨간색보다 info/warning tint를 사용한다.

### 7.7 Flow

- 3단계:
  1. 관심 지역 검색 또는 지도 선택.
  2. 필지 정보, 실거래가, 공시지가, 규제 정보 확인.
  3. 관심 지역 저장 및 주변 비교.
- 데스크톱은 가로 stepper, 모바일은 세로 stepper로 구현한다.

### 7.8 Use Cases

- 토지 소유주.
- 매수·매도 검토자.
- 귀농·전원주택 준비자.
- 중개사·전문가.

각 카드는 `상황`, `필요 정보`, `땅뷰가 돕는 방식`을 짧게 연결한다.

### 7.9 FAQ

- `prd.md` FAQ 초안을 기반으로 아코디언을 구현한다.
- 매물 관련 FAQ는 노출 여부를 별도 플래그로 관리한다.
- 데이터 최신성, 출처, 서비스 제공 지역, 초보자 사용 가능 여부를 우선 노출한다.

### 7.10 Final CTA / Footer

- Final CTA에는 지역 검색 체험과 출시 알림 신청을 다시 배치한다.
- Footer에는 회사명, 문의, 개인정보처리방침, 이용약관, 정보 이용 유의사항, 데이터 출처 안내 링크를 둔다.
- 정보 이용 유의 문구는 별도 페이지와 footer 양쪽에서 접근 가능하게 한다.

## 8. 리드 폼 계획

- 필수 입력:
  - 이름 또는 닉네임.
  - 이메일 또는 휴대폰 번호.
  - 관심 지역.
- 선택 입력:
  - 이용 목적.
  - 마케팅 수신 동의.
- 필수 동의:
  - 개인정보 수집 및 이용 동의.
- 마케팅 수신 동의는 필수 동의와 분리한다.
- 초기 구현에서는 submit 후 `신청이 접수되었습니다` 상태를 표시하고, 실제 저장 API는 추후 연결한다.

## 9. SEO 및 메타데이터

- `app/layout.tsx`에 기본 metadata를 정의한다.
- Title: `땅뷰 | 지역별 토지 실거래가·공시지가·규제 정보를 한 화면에서`.
- Description: `관심 지역의 토지 실거래가, 공시지가, 용도지역, 규제 정보를 땅뷰 한곳에서 확인하세요. 여러 사이트에 흩어진 땅 정보를 지역별로 정리해 보여드립니다.`
- 주요 키워드는 콘텐츠 본문 안에 자연스럽게 배치한다.
- Open Graph 이미지는 지도/필지 패널 기반 mockup으로 추후 제작한다.

## 10. 접근성 및 사용성

- 모든 interactive element는 `button`, `a`, `input` 등 의미 있는 HTML 요소로 구현한다.
- 포커스 스타일은 토큰 기반으로 명확히 표시한다.
- 목업 이미지 또는 시각화 영역에는 핵심 정보를 대체 텍스트 또는 인접 텍스트로 제공한다.
- 색상만으로 상태를 구분하지 않고 badge text를 함께 제공한다.
- 모바일 하단 고정 CTA는 본문 CTA와 겹치지 않도록 하단 padding을 확보한다.

## 11. 컴플라이언스 체크리스트

- 투자 권유 또는 자문으로 오인될 수 있는 문구 제거.
- 제공하지 않는 기능을 제공하는 것처럼 표기하지 않기.
- 공공 데이터 출처 및 기준 시점 표기 방식 검토.
- 가격 정보 예시가 실제 데이터로 오인되지 않도록 예시 라벨 표시.
- 개인정보 수집 동의와 마케팅 수신 동의 분리.
- 앱스토어/구글플레이 배지가 들어갈 경우 실제 앱 등록 상태와 연결 URL 확인.

## 12. 구현 순서

1. Next.js 프로젝트 초기화 및 TypeScript, lint, formatting 설정.
2. `_ds` 토큰을 `src/styles/tokens/`로 이식하고 `globals.css` 구성.
3. 공통 UI 컴포넌트 `Button`, `Card`, `Badge`, `SearchBox`, `LeadForm`, `Accordion`, `DataTable` 구현.
4. `landingContent.ts`에 PRD 기반 섹션 콘텐츠를 구조화.
5. Header, Hero, Problem, Solution, Feature, DataTrust 섹션 구현.
6. InfoChecklist, Flow, UseCase, FAQ, FinalCTA, Footer 구현.
7. 모바일 하단 고정 CTA 및 responsive layout 보정.
8. 개인정보처리방침, 이용약관, 정보 이용 유의사항 placeholder 페이지 작성.
9. SEO metadata, Open Graph 기본값, favicon placeholder 정리.
10. 접근성, 반응형, build 검증 후 문구 리스크 최종 점검.

## 13. 검증 계획

- `npm run lint`: lint 오류 확인.
- `npm run build`: Next.js production build 확인.
- 모바일, 태블릿, 데스크톱 viewport에서 layout overflow와 CTA 가시성 확인.
- 키보드 tab 이동, focus 표시, form label 연결 확인.
- 카피 점검:
  - 투자 권유 표현 없음.
  - 수익 보장 표현 없음.
  - `100% 정확`, `실시간` 표현 없음.
  - 매물 호가 기능을 제공 기능으로 표기하지 않음.
- 디자인 점검:
  - raw hex와 raw px 사용 최소화.
  - card shadow 사용 없음.
  - bluegray neutral와 제한적 orange CTA 사용.
  - 모바일 CTA 터치 영역 44px 이상.

## 14. 보류 및 추후 결정 항목

- 실제 리드 저장 API 또는 CRM 연동 방식.
- 앱스토어/구글플레이 링크 확정 여부.
- 실제 공공 데이터 연동 기관명과 출처 표기 문구.
- 땅뷰 로고 또는 심볼 자산 제공 여부.
- Open Graph 이미지 제작 방식.
- 매물 호가 데이터 확보 후 관련 기능/FAQ 노출 여부.
