# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.3.0] - 2026-01-29

### M3: 알림 시스템

#### Added

**Phase 1: 알림 인프라 구축**
- `notification_logs` 테이블 스키마 업데이트 (recipient, message_content, status 컬럼 추가)
- RLS 정책 및 인덱스 추가 (notification_logs)
- 알림 서비스 추상화 레이어 (`lib/notifications/`)
  - `NotificationService` 인터페이스
  - `SolapiNotificationService` 구현체
  - `NotificationType` enum (모임 리마인드, 대기자, 세그먼트별)
- 알림 발송 로그 저장 로직 (`saveNotificationLog`, `isDuplicateNotification`)
- Supabase Service Role Client 추가 (`createServiceRoleClient`)
- 환경변수에 솔라피 API 설정 추가
- 테스트 알림 발송 API (`POST /api/notifications/test`)

**Phase 2: 모임 리마인드 알림**
- `sendMeetingReminders` 함수 (3일 전/1일 전/당일)
- 리마인드 발송 Cron API (`GET /api/cron/send-reminders?days_before=N`)
- 중복 발송 방지 로직 (24시간 내 동일 알림 차단)
- 취소/대기 상태 참가자 제외
- Vercel Cron 설정 (매일 오전 7시 실행)

**Phase 3: 대기자 & 세그먼트 알림**
- 대기자 자리 발생 알림 (`notifyWaitlistSpotAvailable`)
- 대기자 응답 시간 초과 체크 (`checkWaitlistExpiration`)
  - 응답 대기 시간 자동 계산 (모임 일정 기준: 24시간/6시간/2시간)
- 월말 참여 독려 알림 (`sendMonthlyParticipationReminder`)
- 온보딩 이탈 위험 알림 (`sendOnboardingAtRiskReminder`)
- 휴면 위험 알림 (`sendDormantAtRiskReminder`)
- 자격 만료 임박 알림 (`sendEligibilityExpiringReminder`)
- 대기자 만료 체크 Cron API (`GET /api/cron/check-waitlist-expiration`)
- 세그먼트별 리마인드 Cron API (`GET /api/cron/send-segment-reminders?type=TYPE`)

**Phase 4: 운영자 알림 관리**
- 수동 알림 발송 API (`POST /api/admin/notifications/send`)
  - 대상 선택: 전체 회원 / 특정 모임 참가자 / 개인
- 알림 발송 이력 조회 API (`GET /api/admin/notifications/logs`)
  - 필터링 (성공/실패)
  - 페이지네이션 (limit, offset)
- 운영자 권한 검증 (admin, super_admin)

#### Changed
- `env.ts`에 솔라피 환경변수 및 Service Role Key 추가
- `expire-deposits` Cron에 logger 추가 (console.log 제거)

---

## [0.2.0] - 2026-01-29

### M2: 계좌이체 신청 & Beta 오픈

#### Added

**Phase 1: 카카오 로그인 & 신청 스키마**
- 카카오 OAuth 로그인 시스템 (`/auth/login`, `/auth/callback`)
- 신규 사용자 닉네임 설정 페이지 (`/auth/setup-nickname`)
- `registration_status` enum 타입 추가 (pending_transfer, confirmed, cancelled, expired, waiting)
- `registrations` 테이블 스키마 (입금자명, 결제금액, 입금기한, 환불계좌 등)
- `waitlists` 테이블 스키마 (대기 순번 관리)
- `refund_policies` 테이블 스키마 (환불 규정)

**Phase 2: 계좌이체 신청 플로우**
- `RegistrationModal` 컴포넌트 (2단계 신청 플로우)
- `RegistrationButton` 컴포넌트 (상태별 버튼 표시)
- 신청 API (`POST /api/registrations`)
- PostgreSQL RPC 함수 `create_registration_with_capacity_check` (동시성 제어)
- 48시간 입금 기한 자동 계산
- 계좌번호 클립보드 복사 기능
- 환경변수 기반 은행 정보 관리

**Phase 3: 운영자 입금 확인**
- 운영자 입금 확인 페이지 (`/admin/deposits`)
- `DepositList` 컴포넌트 (입금 대기 목록)
- 입금 확인 API (`POST /api/admin/deposits/confirm`)
- 입금 기한 만료 자동 처리 Cron (`/api/cron/expire-deposits`)

**Phase 4: 취소/환불 & 대기자 시스템**
- `CancelModal` 컴포넌트 (환불 계좌 입력)
- 취소 API (`POST /api/registrations/[id]/cancel`)
- 대기자 API (`/api/waitlists` - POST/GET/DELETE)
- 대기자 자동 승격 로직

**Phase 5: 마이페이지 신청 내역**
- 마이페이지 (`/my`)
- `RegistrationHistory` 컴포넌트 (신청/대기 내역 표시)
- 상태별 뱃지 표시 (입금대기, 확정, 취소, 만료, 대기중)
- `LogoutButton` 컴포넌트

**인프라 & 도구**
- `useRealtimeParticipants` 훅 (Supabase Realtime 참가자 수 실시간 업데이트)
- Vercel Cron 설정 (`vercel.json`)
- 환경변수 예시 파일 (`.env.example`) 업데이트
- 오케스트레이션 스킬 (`phase-checkpoint`, `session-state`)

#### Changed
- 모임 상세 페이지에 환불 규정 표시 추가
- ESLint 설정에 config 파일 무시 규칙 추가

#### Fixed
- `CancelModal` status 타입을 `string`에서 `RegistrationStatus`로 수정
- Supabase 조인 쿼리 타입 캐스팅 수정
- `meetings/[id]/page.tsx` import 문 오류 수정

---

## [0.1.0] - 2026-01-XX

### M1: 모임 등록 & 읽기

#### Added
- 프로젝트 초기 설정 (Next.js 16, TypeScript, Tailwind CSS)
- Supabase 연동 설정
- 모임 목록 페이지 (`/meetings`)
- 모임 상세 페이지 (`/meetings/[id]`)
- 운영자 모임 생성 페이지 (`/admin/meetings/new`)
- 기본 인증 시스템
- 디자인 시스템 (색상, 타이포그래피, 컴포넌트)

---

## Notes

### 환경변수
M3 이후 필요한 환경변수:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BANK_NAME=
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=
NEXT_PUBLIC_BANK_ACCOUNT_HOLDER=
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=
CRON_SECRET=
```

### 데이터베이스 마이그레이션
`database/schema.sql` 파일에 전체 스키마가 정의되어 있습니다.
새 Supabase 프로젝트 설정 시 해당 SQL을 실행하세요.

### Pending (API 연결 후)
- Supabase 프로젝트 연결
- 카카오 OAuth 설정
- RLS 정책 활성화
- Vercel Cron 연결
- 솔라피 API 키 발급
- 카카오 알림톡 템플릿 등록 및 승인
