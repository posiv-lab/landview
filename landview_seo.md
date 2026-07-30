# 땅뷰(landview) SEO 구축 및 운영 문서

- 기준 도메인: `https://landview.vercel.app`
- 한글 서비스명: `땅뷰`
- 영문 도메인·기술 식별자: `landview`
- 최종 정비일: 2026-07-30

## 1. 우선순위와 처리 결과

| 순위 | 항목 | 상태 | 처리 내용 |
| --- | --- | --- | --- |
| 1 | 대표 도메인 통일 | 완료 | 모든 canonical과 메타데이터 기준을 `https://landview.vercel.app`으로 통일했다. |
| 2 | 구 도메인 중복 제거 | 완료 | `https://ddangview.vercel.app`의 루트와 모든 하위 경로를 새 도메인으로 308 영구 리디렉션한다. |
| 3 | robots.txt·sitemap.xml | 완료 | 검색 허용 범위와 공개 URL 목록을 Next.js Metadata Route로 생성했다. |
| 4 | 검색엔진 등록 | 사용자 확인 필요 | Google·Naver의 사이트 소유권 확인은 계정 로그인이 필요하다. 코드에는 환경변수 기반 확인 태그 지원을 넣었다. |
| 5 | 회원·인증 페이지 색인 방지 | 완료 | 로그인, 회원가입, 계정, 이메일 인증, 비밀번호 재설정 페이지에 `noindex, nofollow`를 적용했다. |
| 6 | 페이지별 메타데이터 | 완료 | 공개 페이지별 고유 제목, 설명, canonical, Open Graph, X(Twitter) 메타데이터를 적용했다. |
| 7 | 실제 데이터 기반 콘텐츠 | 일부 완료 | 현재 연결 데이터의 출처·제공 범위 페이지를 추가했다. 지역·필지 SEO 페이지는 실제 실거래가·규제 데이터 연결 후 생성한다. |
| 8 | 신뢰 정보 | 완료·보완 필요 | 데이터 출처, 캐시 기준, 현재/계획 기능 구분, 정보 이용 유의사항, 개인정보처리방침과 이용약관을 정리했다. 법적 운영자 정보는 확정 후 추가해야 한다. |
| 9 | 내부 링크·구조화 데이터 | 완료 | 푸터에 후기·데이터 출처·정책 페이지 링크를 연결하고 홈페이지에 Organization, WebSite, WebApplication JSON-LD를 추가했다. |
| 10 | 검색·공유 이미지 | 완료 | SVG 파비콘, 웹 앱 manifest, 1200×630 Open Graph 이미지를 추가했다. |
| 11 | Core Web Vitals | 1차 검증 완료 | 프로덕션 빌드와 린트를 통과했다. 실제 사용자 지표는 Search Console/Speed Insights 데이터가 쌓인 뒤 관리한다. |

## 2. 현재 검색 공개 URL

다음 URL은 canonical과 함께 sitemap에 포함한다.

- `https://landview.vercel.app/`
- `https://landview.vercel.app/map`
- `https://landview.vercel.app/reviews`
- `https://landview.vercel.app/data-sources`
- `https://landview.vercel.app/info-disclaimer`
- `https://landview.vercel.app/privacy`
- `https://landview.vercel.app/terms`

다음 페이지는 사용 목적상 검색 결과에 노출하지 않는다.

- `/account`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

`/api/` 경로는 `robots.txt`에서 수집을 제한한다. `noindex`를 읽어야 하는 인증 페이지는 robots.txt에서 막지 않았다.

## 3. 구현 파일

- 전역 SEO 기준: `src/lib/seo.ts`
- 전역 메타데이터: `app/layout.tsx`
- 홈페이지 구조화 데이터: `src/components/seo/SiteStructuredData.tsx`
- 검색로봇 정책: `app/robots.ts`
- 사이트맵: `app/sitemap.ts`
- 파비콘: `app/icon.svg`
- 공유 이미지: `app/opengraph-image.tsx`
- 웹 앱 manifest: `app/manifest.ts`
- 데이터 출처 페이지: `app/data-sources/page.tsx`

## 4. 반드시 사용자가 해야 하는 검색엔진 등록

### 4.1 Google Search Console

1. [Google Search Console](https://search.google.com/search-console)에서 `URL 접두어` 속성으로 `https://landview.vercel.app/`을 추가한다.
2. 소유권 확인 방법에서 `HTML 태그`를 선택한다.
3. Google이 제공하는 `<meta>` 태그에서 `content="..."` 안의 값만 복사한다.
4. Vercel의 `landview` 프로젝트 → Settings → Environment Variables에서 `GOOGLE_SITE_VERIFICATION`으로 저장한다.
5. Production에 적용하고 재배포한 뒤 Search Console에서 `확인`을 누른다.
6. Sitemaps 메뉴에 `https://landview.vercel.app/sitemap.xml`을 제출한다.
7. URL 검사에서 홈페이지, `/map`, `/data-sources`를 검사하고 색인 생성을 요청한다.

### 4.2 네이버 서치어드바이저

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에 `https://landview.vercel.app`을 등록한다.
2. HTML 태그 확인 코드의 `content` 값만 복사한다.
3. Vercel 환경변수 `NAVER_SITE_VERIFICATION`에 저장하고 Production을 재배포한다.
4. 소유권 확인 후 요청 → 사이트맵 제출에서 `https://landview.vercel.app/sitemap.xml`을 입력한다.
5. 검증 → robots.txt에서 수집과 사이트맵 인식 여부를 확인한다.

### 4.3 Bing Webmaster Tools

1. [Bing Webmaster Tools](https://www.bing.com/webmasters/)에서 Google Search Console 속성을 가져오거나 사이트를 직접 등록한다.
2. `https://landview.vercel.app/sitemap.xml`을 제출한다.

## 5. 콘텐츠 SEO 확장 원칙

현재 실제 연결된 데이터는 카카오 지도, VWorld 연속지적도와 토지·임야대장 속성정보다. 아직 연결되지 않은 실거래가, 용도지역·규제, 공매·경매 정보를 이미 제공하는 것처럼 색인 페이지를 대량 생성하면 얇은 콘텐츠와 사실성 문제가 생길 수 있으므로 만들지 않는다.

실제 API와 저장 데이터가 준비되면 다음 순서로 확장한다.

1. 시·군·구 지역 페이지: 지역 개요, 실제 거래 건수·중앙값, 면적 구간별 비교, 기준일과 출처를 서버 렌더링한다.
2. 읍·면·동 페이지: 상위 지역과 중복되지 않는 통계와 지도 진입 링크를 제공한다.
3. 필지 상세 페이지: 공개 가능한 PNU 기반 정보, 기준일, 주변 비교와 공식 원문 확인 링크를 제공한다.
4. 모든 동적 페이지는 고유 제목·설명·canonical·BreadcrumbList와 내부 링크를 가진다.
5. 데이터가 없거나 본문이 거의 같은 조합 페이지는 `noindex`하거나 생성하지 않는다.

권장 URL 예시는 다음과 같다.

```text
/regions/{시도-슬러그}/{시군구-슬러그}
/regions/{시도-슬러그}/{시군구-슬러그}/{읍면동-슬러그}
/parcel/{pnu}
```

## 6. 신뢰도 보완 항목

정식 서비스 운영 전 다음 사실 정보를 개인정보처리방침, 이용약관, 푸터와 Organization 구조화 데이터에 추가한다.

- 법적 상호 또는 운영자명
- 사업자등록번호(해당하는 경우)
- 사업장 또는 연락 주소
- 개인정보 보호 문의 담당자와 연락처
- 실제 운영 이메일
- 서비스별 개인정보 보관·삭제 기준

확정되지 않은 주소, 전화번호, 법적 상호는 검색 노출을 위해 임의로 만들지 않는다.

## 7. 성과 측정 기준

검색엔진 등록 후 매월 다음 항목을 확인한다.

- 색인된 공개 URL 수와 제외 사유
- 브랜드 검색어 `땅뷰`, `landview` 노출 여부
- `토지 지도`, `필지 경계`, `토지대장 면적` 관련 노출·클릭·평균 순위
- 모바일 Core Web Vitals의 LCP, INP, CLS
- `/map` 진입률과 검색 → 필지 선택 전환
- 404, 잘못된 canonical, 구조화 데이터 오류

## 8. 공식 참고 문서

- [Google 검색 개발자 가이드](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Google canonical 지정 방법](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google 사이트맵 생성·제출](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google robots meta 규격](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Google Organization 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [네이버 robots.txt 설정](https://searchadvisor.naver.com/guide/seo-basic-robots)
- [네이버 RSS 및 사이트맵 제출](https://searchadvisor.naver.com/guide/request-feed)
- [Bing 사이트맵 안내](https://www4.bing.com/webmasters/help/sitemaps-3b5cf6ed)
