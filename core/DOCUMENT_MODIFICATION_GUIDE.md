# 문서별 상세 수정 가이드

**작성일:** 2026-01-28  
**참조:** DOCUMENT_REVIEW_REPORT.md

이 문서는 각 핵심 문서의 구체적인 수정 사항을 정리합니다.

---

## 1. 서비스 개요 (v1.3 → v1.4)

### 1.1 제거해야 할 섹션

#### §7 핵심 규칙 (서비스에 반영) - **전체 이동**
```markdown
현재:
- 모든 모임 참여의 전제조건 = 정기모임 참여 이력
- 6개월 이내 정기모임 참여 기록 없으면 다른 모임 참여 불가
- 환불 규정: 정기모임 3일 전 100% / 2일 전 50% / 이후 불가 :5일전 100%로 바꾸자
            토론모임 2주 전 100% / 7일 전 50% / 이후 불가
- 참가비 단위: "콩"

이동: PRD §8 가정, 제약 사항 및 의존성 → 제약 사항에 추가
```

#### §8 주요 기능 - **대폭 축소**
```markdown
현재: MVP 기능 32개 항목 상세 나열

변경:
## 8. 핵심 기능 요약

**일정 경험:** 캘린더 뷰, 컴팩트 카드 UI
**신청/결제:** 간편결제, 대기 신청 :계좌이체도 가능하게 해야해.
**취소/환불:** 셀프 취소, 자동 환불
**리마인드:** 자동 알림톡
**소속감:** 배지, 칭찬, 책장
**신규 회원:** 후킹 랜딩페이지
**운영자:** 대시보드, 권한 관리

> 상세 기능 정의는 PRD v1.5를 참조하세요.
```

#### §9 사용자 경험 흐름 - **전체 이동**
```markdown
현재: 기존 회원/신규 회원/취소 흐름 상세

변경:
## 9. 사용자 경험 요약

기존 회원: 로그인 → 일정 확인 → 신청/결제 → 리마인드 → 참여 → 후기
신규 회원: 후킹페이지 → 첫 모임 신청 → 환영 알림 → 참여 → 온보딩

> 상세 UX 플로우는 PRD §6을 참조하세요.

이동: PRD §6 UX 및 디자인 가이드
```

#### §12 플랫폼 - **이동**
```markdown
현재:
- 1차: 웹서비스 (모바일 최적화 반응형)
- 추후: 앱 (웹뷰 또는 네이티브)

이동: 기술 스택 §3.1 또는 삭제 (이미 기술 스택에 있음)
```

### 1.2 유지해야 할 섹션 (수정 없음)
- §1 서비스명
- §2 서비스 한 줄 정의
- §3 해결하려는 문제
- §4 본질
- §5 핵심 가치
- §6 타겟 사용자
- §10 기대 효과
- §11 브랜드 톤

### 1.3 추가해야 할 항목
```markdown
## 변경 이력 (업데이트)
| 2026-01-28 | 1.4 | 핵심 규칙/상세 기능/UX 플로우를 PRD로 이동. 본질과 가치에 집중하도록 구조 개편 |
```

---

## 2. PRD (v1.4 → v1.5)

### 2.1 §5 제품 개념 및 주요 기능 - 구현 세부사항 제거

#### 제거해야 할 내용

**신청/결제 섹션에서:**
```markdown
❌ 제거:
- 입금자명 형식: "MMDD_이름" (예: 0125_홍길동) :이건 그럼 어디다가 넣나요? 이거 중요한겁니다. 계좌이체 결제시.
- 계좌 정보 클립보드 복사 기능 : 이것도 필요한건데요
- 입금 완료 체크 시 정원 즉시 예약 (다른 사용자 신청 차단) : 이건 아니에요. 참여자가 입금완료했다는 버튼을 누르면 기본적으로 일단 참여신청이되는 걸로 해요.
- 24시간 미입금 시 자동 취소 및 정원 복구 :이것도 필요하지 않나요 계좌이체도 있다면?
- 운영자 입금 확인 후 참가 확정 전환

✅ 유지 (맥락으로):
- 간편결제 (카카오페이, 토스페이먼츠): 즉시 결제 → 참가 확정
- 계좌이체: 입금 → 운영자 확인 → 참가 확정
- 계좌이체 미입금 시 자동 취소
```

**대기 신청 섹션에서:**
```markdown
❌ 제거:
- 응답 대기 시간: 이걸 제거하면 어디다가 둔다는거죠?
  - 모임 3일 전 이전: 24시간
  - 모임 3일 전 ~ 1일 전: 6시간
  - 모임 1일 전 이후: 2시간

✅ 변경:
- 자리 발생 시 대기자에게 알림
- 응답 대기 시간은 모임 임박도에 따라 차등 적용

이동: 시스템 구조 §5.4 대기자 처리 흐름 : 아 여기로 이동시킨다고? 좋습니다.
```

**칭찬하기 섹션에서:**
```markdown
❌ 제거:
- 선택형 문구:
  - 덕분에 좋은 시간이었어요
  - 이야기가 인상 깊었어요
  - 따뜻한 분위기를 만들어주셨어요
  - 새로운 관점을 얻었어요
  - 다음에도 함께하고 싶어요

✅ 변경:
- 익명 칭찬, 선택형 문구 5개 제공
- 한 모임당 1명, 같은 사람에게 3개월 내 중복 불가

이동: UI 상세는 design-system.md
```

### 2.2 §6 UX 및 디자인 가이드 - 대폭 축소

#### 전체 제거 (design-system.md에 이미 있음)

```markdown
❌ 제거할 전체 섹션:

### 그리드 시스템
- 8px 그리드: 모든 여백, 크기는 8의 배수 (8, 16, 24, 32, 48, 64...)
- 컴포넌트 간 간격: 16px (작음), 24px (보통), 32px (큼)
- 페이지 패딩: 모바일 16px, 데스크톱 24px

### 타이포그래피
| 용도 | 폰트 | 굵기 | 예시 |
|------|------|------|------|
| 본문, UI | Pretendard | 400, 500, 600 | 버튼, 카드 텍스트, 본문 |
| 제목, 브랜드 | Noto Serif KR | 500, 700 | 모임명, 랜딩페이지 헤드라인, 책 제목 |

### 애니메이션 사양
| 상황 | 효과 | 구현 방식 |
|------|------|---------| 
| 페이지 진입 시 카드 리스트 | 아래→위 Stagger (100ms 간격) | Framer Motion `staggerChildren` |
| ...

### 마이크로 인터랙션 원칙
...
```

#### 유지해야 할 내용 (간소화)

```markdown
## 6. UX 및 디자인 가이드

### 핵심 사용자 흐름
(현재 내용 유지)

### 브랜드 톤
(현재 내용 유지)

### UX 원칙
- 모바일 우선
- 최소 입력 (클릭 위주)
- 명확한 상태 표시
- 신청 완료까지 3단계 이내

### 참조
> 상세 디자인 시스템 (그리드, 폰트, 애니메이션)은
> `design-system.md`를 참조하세요.
```

### 2.3 §8 가정, 제약 사항 및 의존성 - 추가

```markdown
### 제약 사항 (Constraints) - 추가 내용

**비즈니스 규칙:**
- 정기모임 참여 자격: 6개월 이내 정기모임 참여 기록 필요
- 참가비 단위: "콩" (예: 10,000콩)
- 정원: 기본 14명 (모임별 가변)

**환불 규정:**
- 정기모임: 3일 전 100%, 2일 전 50%, 이후 불가
- 토론모임: 2주 전 100%, 7일 전 50%, 이후 불가
- 기타 모임: 생성 시 직접 설정

**칭찬 규칙:**
- 한 모임당 1명에게만 칭찬 가능
- 같은 사람에게 3개월 내 중복 칭찬 불가
- 익명 처리

**참가 인원 표시:**
- 정원 숫자는 표시하지 않음 ("O명 참여"만 표시)
- 마감 임박: 남은 자리 3명 이하 시 표시
```

### 2.4 변경 이력 추가

```markdown
| 2026-01-28 | 1.5 | §5 구현 세부사항 제거, §6 디자인 시스템 분리, §8 비즈니스 규칙 추가 |
```

---

## 3. 기술 스택 및 개발 로드맵 (v1.2 → v1.3)

### 3.1 §6.8 Phase 6 간소화

```markdown
현재 (제거 대상):
### 6.8 Phase 6: 회원 참여 확장 (2차 개발)

#### 6.8.1 진행자 시스템
(상세 스펙 40줄)

#### 6.8.2 오늘의 지독해 (소식 피드)
(상세 스펙 35줄)

변경:
### 6.8 Phase 6: 회원 참여 확장 (2차 개발)

MVP 안정화 후 진행. 상세 스펙은 PRD v2.0에서 정의 예정.

**예정 기능:**
- 진행자 시스템: 정기모임 자율 운영을 위한 진행자 선정/알림
- 오늘의 지독해: 홈 화면 활동 피드

**구현 가능 여부:** ✅ 현재 구조로 모두 구현 가능
```

### 3.2 변경 이력 추가

```markdown
| 2026-01-28 | 1.3 | §6.8 2차 개발 상세 스펙 간소화 (PRD v2.0으로 이동 예정) |
```

---

## 4. 시스템 구조 (파일명 변경)

### 4.1 파일명 수정

```
현재: 3__지독해_웹서비스_-_시스템_구조_v1.3.md
변경: 3__지독해_웹서비스_-_시스템_구조_v1.4.md
```

### 4.2 본문 수정

```markdown
현재 (제거):
> ⚠️ **참고:** 이 파일명은 `v1.3.md`이지만 내용은 v1.4입니다. (변경 이력 참조)

변경: 해당 메모 제거 또는 버전 통일
```

---

## 5. Milestones 분리

### 5.1 파일 분리 계획

| 현재 | 분리 후 |
|------|--------|
| milestones.md (67 Phase) | milestones-mvp.md (M1~M6, 26 Phase) |
| | milestones-growth.md (M7, 4 Phase) |
| | milestones-exp.md (M8~M12, 18 Phase) |
| | milestones-backoffice.md (M13~M18, 19 Phase) |

### 5.2 milestones-mvp.md 구조

```markdown
# 지독해 웹서비스 MVP - Milestones

## 1. 개요
## 2. MVP Milestone 전체 구조 (M1~M6만)
## 3. Milestone 상세 (M1~M6만)
## 4. 전체 타임라인
## 5. 의존성 매트릭스
## 6. 핵심 가치별 매핑
## 7. 테스트 전략
## 8. 위험 관리
## 9. 성공 기준
## 10. AI 에이전트 개발 가이드
## 11. Work Packages

## 부록: M7 (출시 후 1개월)
(간략 요약만, 상세는 milestones-growth.md)
```

### 5.3 현재 문서 유지 옵션

분리하지 않고 유지하려면, 최소한 다음 수정 권장:

```markdown
## 변경

### Part 1: MVP (M1~M6) - 현재 집중
### Part 2: Growth (M7) - M6 완료 후
### Part 3: Experience Enhancement (M8~M12) - 별도 계획
### Part 4: 백오피스 MVP (M13~M18) - 별도 계획

**현재 활성 범위:** Part 1 (M1~M6)만

> Part 2~4는 MVP 정식 출시 후 별도 로드맵으로 관리됩니다.
> 상세 내용은 참고용으로만 활용하세요.
```

---

## 6. Design System (v3.3 → v3.4)

### 6.1 변경 이력 추가 필요

```markdown
## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-25 | 3.3 | 테마 시스템 재정리, 콩 아이콘 개선 |
| 2026-01-28 | 3.4 | PRD에서 이관된 그리드/폰트/애니메이션 사양 통합 |
```

### 6.2 PRD에서 이관받은 내용 (이미 있는지 확인)

- ✅ 8px 그리드 시스템 → 이미 있음
- ✅ Pretendard/Noto Serif KR → 이미 있음
- ✅ Framer Motion 애니메이션 → 이미 있음
- ✅ 마이크로 인터랙션 원칙 → 이미 있음

→ PRD에서 제거해도 문제 없음 확인 완료

---

## 7. 신규 생성 파일

### 7.1 /database/schema.sql

시스템 구조 §6에서 언급된 테이블을 SQL로 변환:

```sql
-- 지독해 웹서비스 DB 스키마
-- 생성일: 2026-01-28
-- Supabase PostgreSQL 기준

-- 사용자
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,                    -- 실명 (본인/운영자만 조회, 계좌이체/정산용)
    nickname VARCHAR(20) NOT NULL,                 -- 닉네임 (타 사용자에게 노출, 유니크)
    phone VARCHAR(20),
    auth_type VARCHAR(20) DEFAULT 'email',         -- email, kakao
    role VARCHAR(20) DEFAULT 'member',             -- member, admin, super_admin
    is_new_member BOOLEAN DEFAULT true,
    first_regular_meeting_at TIMESTAMP,
    last_regular_meeting_at TIMESTAMP,
    total_participations INTEGER DEFAULT 0,
    consecutive_weeks INTEGER DEFAULT 0,
    total_praises_received INTEGER DEFAULT 0,
    nickname_changed_at TIMESTAMP,                 -- 닉네임 변경일 (30일 제한용)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT users_nickname_unique UNIQUE (nickname),
    CONSTRAINT users_nickname_length CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 20),
    CONSTRAINT users_nickname_format CHECK (nickname ~ '^[가-힣a-zA-Z0-9_]+$')
);

-- 환불 규정
CREATE TABLE refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_type VARCHAR(50) NOT NULL,
    days_before INTEGER NOT NULL,
    refund_rate INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 모임
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'regular',
    datetime TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER DEFAULT 14,
    fee INTEGER NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    refund_policy_id UUID REFERENCES refund_policies(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 신청
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    meeting_id UUID REFERENCES meetings(id),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20), -- pg, bank_transfer
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_amount INTEGER,
    depositor_name VARCHAR(100),
    deposit_deadline TIMESTAMP,
    refund_account JSONB,
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,
    refund_amount INTEGER,
    participation_status VARCHAR(20), -- completed, no_show
    participation_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, meeting_id)
);

-- 대기
CREATE TABLE waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    meeting_id UUID REFERENCES meetings(id),
    position INTEGER NOT NULL,
    notified_at TIMESTAMP,
    response_deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, meeting_id)
);

-- 칭찬
CREATE TABLE praises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    meeting_id UUID REFERENCES meetings(id),
    message_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sender_id, meeting_id)
);

-- 배지
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    badge_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- 책장
CREATE TABLE bookshelf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    book_title VARCHAR(255) NOT NULL,
    book_author VARCHAR(255),
    one_line_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_title, book_author)
);

-- 후기
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    meeting_id UUID REFERENCES meetings(id),
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 건의
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    meeting_id UUID REFERENCES meetings(id),
    content TEXT NOT NULL,
    response TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 알림 템플릿
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    send_timing VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 알림 발송 기록
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    meeting_id UUID REFERENCES meetings(id),
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT
);

-- 운영자 권한
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    permission VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- 배너
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책 (예시)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;

-- 인덱스
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_meeting ON registrations(meeting_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_meetings_datetime ON meetings(datetime);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
```

### 7.2 .env.example

```bash
# 지독해 웹서비스 환경 변수

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 포트원 (결제)
PORTONE_IMP_KEY=your-imp-key
PORTONE_IMP_SECRET=your-imp-secret
PORTONE_WEBHOOK_SECRET=your-webhook-secret

# 솔라피 (알림톡)
SOLAPI_API_KEY=your-api-key
SOLAPI_API_SECRET=your-api-secret
SOLAPI_SENDER_NUMBER=your-sender-number

# 카카오 (로그인)
KAKAO_CLIENT_ID=your-client-id
KAKAO_CLIENT_SECRET=your-client-secret

# 앱 설정
NEXT_PUBLIC_APP_URL=https://brainy-club.com
```

---

## 실행 체크리스트

### 즉시 (Priority 1)
- [ ] Milestones 문서 상단에 "현재 범위: M1~M6" 명시
- [ ] PRD §6 애니메이션 코드 제거
- [ ] 시스템 구조 파일명 변경 (v1.3 → v1.4)
- [ ] 서비스 개요 §8 축소

### 이번 주 (Priority 2)
- [ ] PRD §8 제약 사항에 비즈니스 규칙 추가
- [ ] Design System 변경 이력 추가
- [ ] 기술 스택 §6.8 간소화
- [ ] /database/schema.sql 생성

### 다음 주 (Priority 3)
- [ ] .env.example 생성
- [ ] API 엔드포인트 상세 문서
- [ ] Milestones 분리 (선택)
