# 회원·로그인·후기 배포 체크리스트

코드 구현과 검증은 완료되어 있다. 아래 작업은 Supabase, Resend, Vercel 계정 권한이 필요하므로 프로젝트 소유자가 직접 진행한다.

## 1. Supabase SQL 실행

1. Supabase 프로젝트의 **SQL Editor**를 연다.
2. [`202607300001_create_custom_auth_and_reviews.sql`](../supabase/migrations/202607300001_create_custom_auth_and_reviews.sql)의 전체 내용을 붙여넣는다.
3. **Run**을 눌러 한 번만 실행한다.
4. Table Editor에서 다음 테이블이 생성되었는지 확인한다.
   - `users`
   - `user_sessions`
   - `user_action_tokens`
   - `auth_rate_limits`
   - `reviews`
5. Database → Views에서 다음 뷰가 생성되었는지 확인한다.
   - `review_public_feed`
   - `review_public_summary`

이 SQL은 Supabase Auth를 만들거나 사용하지 않으며, 위 테이블의 RLS를 비활성화하고 `anon`, `authenticated` 역할의 직접 접근 권한을 제거한다.

## 2. Resend 발신 주소 준비

회원가입 인증과 비밀번호 재설정 메일을 실제 사용자에게 보내려면 Resend에서 발신 도메인이 인증되어 있어야 한다.

1. Resend → Domains에서 소유한 도메인을 인증한다.
2. 인증된 도메인의 발신 주소를 정한다.
   - 예: `LandView <account@landview.example>`
3. 이 값을 아래 `AUTH_EMAIL_FROM`에 사용한다.

`onboarding@resend.dev`는 일반 운영 사용자 전체에게 보내는 발신 주소로 사용하지 않는다.

## 3. Vercel 환경변수 입력

Vercel → LandView 프로젝트 → Settings → Environment Variables에 다음 값을 입력한다.

```dotenv
SUPABASE_URL=https://프로젝트-참조.supabase.co
SUPABASE_SECRET_KEY=Supabase의_서버용_secret_key
APP_URL=https://landview.vercel.app
AUTH_PASSWORD_PEPPER=32바이트_이상의_무작위_문자열
AUTH_SESSION_TTL_DAYS=14
AUTH_EMAIL_FROM=LandView <account@인증한도메인>
RESEND_API_KEY=Resend_API_Key
```

pepper 생성 예시:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

주의:

- `SUPABASE_SECRET_KEY`와 `AUTH_PASSWORD_PEPPER`에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- Production 환경에는 반드시 입력한다.
- Preview 배포에서 회원 기능을 시험하려면 Preview 환경에도 별도로 입력한다.
- `APP_URL`은 이메일 링크가 열릴 실제 운영 주소와 정확히 일치시킨다.

## 4. 재배포와 동작 확인

환경변수를 저장한 뒤 Vercel에서 최신 커밋을 재배포한다.

다음 순서로 확인한다.

1. `/signup`에서 회원가입
2. 받은 메일의 인증 링크 클릭
3. `/login`에서 로그인
4. `/reviews`에서 후기 작성
5. 메인 홈에서 작성한 후기와 평균 평점 확인
6. `/account`에서 내 후기 확인
7. 후기 수정·삭제 확인
8. `/forgot-password`에서 재설정 메일과 기존 세션 종료 확인

문제가 생기면 먼저 Vercel Function Logs에서 환경변수 누락 여부를 확인하되, secret key·pepper·메일 토큰의 실제 값은 로그나 이슈에 복사하지 않는다.
