# 사용자 액션 체크리스트

Beta 오픈 전 사용자가 직접 수행해야 하는 작업 목록입니다.

---

## M1: 기반 구축

### Supabase 프로젝트 설정
- [ ] Supabase 프로젝트 생성 (https://supabase.com)
- [ ] `database/schema.sql` 실행하여 테이블 생성
- [ ] RLS(Row Level Security) 정책 활성화
- [ ] 환경변수 설정:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```

### Vercel 배포 설정
- [ ] Vercel 프로젝트 생성 및 GitHub 연결
- [ ] 환경변수 설정 (Vercel Dashboard)
- [ ] 도메인 설정 (선택)

---

## M2: 계좌이체 신청 & Beta 오픈

### 카카오 OAuth 설정
- [ ] 카카오 개발자 콘솔 앱 생성 (https://developers.kakao.com)
- [ ] 카카오 로그인 활성화
- [ ] Redirect URI 설정: `https://your-domain.com/auth/callback`
- [ ] Supabase Auth Provider에 카카오 추가:
  - Supabase Dashboard → Authentication → Providers → Kakao
  - Client ID, Client Secret 입력

### 은행 계좌 정보 설정
- [ ] 환경변수에 실제 계좌 정보 설정:
  ```
  NEXT_PUBLIC_BANK_NAME=실제은행명
  NEXT_PUBLIC_BANK_ACCOUNT=실제계좌번호
  NEXT_PUBLIC_ACCOUNT_HOLDER=예금주명
  ```

### Vercel Cron 설정
- [ ] Vercel Pro 플랜 필요 (Cron 기능)
- [ ] 또는 외부 Cron 서비스 사용 (Upstash, cron-job.org 등)
- [ ] CRON_SECRET 환경변수 설정:
  ```
  CRON_SECRET=your_secure_random_string
  ```

### 운영자 계정 설정
- [ ] 첫 번째 사용자 가입 후 Supabase에서 직접 role을 'admin' 또는 'super_admin'으로 변경
  ```sql
  UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
  ```

---

## M3: 알림 시스템

### 솔라피 (알림톡) 설정
- [ ] 솔라피 가입 (https://solapi.com)
- [ ] API 키 발급 (대시보드 → API 키 관리)
- [ ] 발신번호 등록 및 인증
- [ ] 환경변수 설정:
  ```
  SOLAPI_API_KEY=your_api_key
  SOLAPI_API_SECRET=your_api_secret
  SOLAPI_SENDER_NUMBER=01012345678
  ```

### 카카오 알림톡 템플릿 등록
- [ ] 카카오 비즈니스 채널 생성
- [ ] 다음 템플릿 등록 및 승인 대기:
  - `MEETING_REMINDER_3DAYS`: 모임 3일 전 리마인드
  - `MEETING_REMINDER_1DAY`: 모임 1일 전 리마인드
  - `MEETING_REMINDER_TODAY`: 모임 당일 리마인드
  - `WAITLIST_SPOT_AVAILABLE`: 대기자 자리 발생
  - `MONTHLY_PARTICIPATION_REMINDER`: 월말 참여 독려
  - `ONBOARDING_AT_RISK`: 온보딩 이탈 위험
  - `DORMANT_AT_RISK`: 휴면 위험
  - `ELIGIBILITY_EXPIRING`: 자격 만료 임박
  - `MANUAL`: 수동 발송용 템플릿

### Supabase Service Role Key 설정
- [ ] Supabase Dashboard → Settings → API → Service Role Key 복사
- [ ] 환경변수 설정:
  ```
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
  ⚠️ **주의**: Service Role Key는 RLS를 우회하므로 절대 클라이언트에 노출되어서는 안 됨

### 테스트
- [ ] 테스트 알림 발송 (`POST /api/notifications/test`)
- [ ] 솔라피 대시보드에서 발송 내역 확인
- [ ] 카카오톡으로 알림 수신 확인

---

## M4: PG 결제 & 소속감 (예정)

### PortOne 설정
- [ ] PortOne 가입 및 상점 등록 (https://portone.io)
- [ ] 테스트 모드 API 키 발급
- [ ] 환경변수 설정:
  ```
  PORTONE_IMP_KEY=your_imp_key
  PORTONE_IMP_SECRET=your_imp_secret
  PORTONE_WEBHOOK_SECRET=your_webhook_secret
  ```

---

## 환경변수 전체 목록 (M3 기준)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Bank Account (계좌이체용)
NEXT_PUBLIC_BANK_NAME=
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=
NEXT_PUBLIC_BANK_ACCOUNT_HOLDER=

# Solapi (알림톡)
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=

# Cron
CRON_SECRET=

# PortOne (M4)
PORTONE_IMP_KEY=
PORTONE_IMP_SECRET=
PORTONE_WEBHOOK_SECRET=
```

---

## 체크 완료 후

모든 설정이 완료되면:
1. `npm run build` 로 빌드 테스트
2. Vercel 배포
3. 실제 환경에서 테스트:
   - 카카오 로그인
   - 모임 신청
   - 입금 확인
   - 취소/환불
   - 알림톡 발송 (M3)
   - Cron 자동 실행 확인 (M3)

문제 발생 시 `jidokhae/` 폴더의 코드와 `database/schema.sql`을 참고하세요.
