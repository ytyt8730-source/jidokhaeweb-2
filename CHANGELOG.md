# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
M2 이후 필요한 환경변수:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BANK_NAME=
NEXT_PUBLIC_BANK_ACCOUNT=
NEXT_PUBLIC_ACCOUNT_HOLDER=
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
