-- 지독해 웹서비스 DB 스키마
-- 생성일: 2026-01-28
-- 최종 수정: 2026-01-29 (M2 스키마 추가)
-- Supabase PostgreSQL 기준

-- ========================================
-- ENUM 타입 정의
-- ========================================

-- 신청 상태 (M2)
CREATE TYPE registration_status AS ENUM (
    'pending_transfer',  -- 입금 대기
    'confirmed',         -- 신청 완료 (입금 확인됨)
    'cancelled',         -- 취소됨
    'expired',           -- 만료됨 (48시간 미입금)
    'waiting'            -- 대기 중
);

-- 결제 방식 (M2)
CREATE TYPE payment_method AS ENUM (
    'bank_transfer',     -- 계좌이체
    'pg'                 -- PG 결제 (M3+)
);

-- 사용자
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(20) UNIQUE NOT NULL, -- 다른 회원에게 노출되는 표시명 (2~20자)
    phone VARCHAR(20),
    auth_type VARCHAR(20) DEFAULT 'email', -- email, kakao
    role VARCHAR(20) DEFAULT 'member', -- member, admin, super_admin
    is_new_member BOOLEAN DEFAULT true,
    first_regular_meeting_at TIMESTAMP,
    last_regular_meeting_at TIMESTAMP,
    total_participations INTEGER DEFAULT 0,
    consecutive_weeks INTEGER DEFAULT 0,
    total_praises_received INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 환불 규정
CREATE TABLE refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_type VARCHAR(50) NOT NULL,
    days_before INTEGER NOT NULL,
    refund_rate INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 환불 규정 기본 데이터 (PRD v1.8 기준)
-- 정기모임: 5일 전 100%, 2일 전 50%, 이후 불가
INSERT INTO refund_policies (meeting_type, days_before, refund_rate) VALUES
    ('regular', 5, 100),
    ('regular', 2, 50),
    ('regular', 0, 0);

-- 토론모임: 2주(14일) 전 100%, 7일 전 50%, 이후 불가
INSERT INTO refund_policies (meeting_type, days_before, refund_rate) VALUES
    ('discussion', 14, 100),
    ('discussion', 7, 50),
    ('discussion', 0, 0);

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

-- 신청 (M2 계좌이체 신청 지원)
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    meeting_id UUID REFERENCES meetings(id) NOT NULL,

    -- 신청 상태 (M2 enum 사용)
    status registration_status DEFAULT 'pending_transfer',

    -- 결제 정보
    payment_method payment_method DEFAULT 'bank_transfer',
    payment_amount INTEGER,

    -- 계좌이체 전용 (M2)
    depositor_name VARCHAR(50),           -- 입금자명 (MMDD_실명)
    deposit_deadline TIMESTAMP,            -- 48시간 마감 시간
    confirmed_at TIMESTAMP,               -- 운영자 입금 확인 시간
    confirmed_by UUID REFERENCES users(id), -- 입금 확인한 운영자

    -- 취소 정보
    cancelled_at TIMESTAMP,
    cancel_reason TEXT,

    -- 환불 계좌 (취소 시 필수)
    refund_bank VARCHAR(50),
    refund_account VARCHAR(50),
    refund_holder VARCHAR(50),
    refund_amount INTEGER,
    refund_completed_at TIMESTAMP,

    -- 참가 정보
    participation_status VARCHAR(20),     -- completed, no_show

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
    recipient VARCHAR(20) NOT NULL,  -- 수신자 전화번호
    message_content TEXT,             -- 발송된 메시지 내용
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'success',  -- success, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
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

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE praises ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookshelf ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS 정책 정의
-- ========================================

-- users 정책
-- 본인 정보 조회/수정
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 다른 회원 닉네임 조회 (참가자 목록 표시용)
CREATE POLICY "Users can view other nicknames" ON users
    FOR SELECT USING (true);

-- 운영자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- meetings 정책
-- 모든 사용자 모임 조회 가능
CREATE POLICY "Anyone can view meetings" ON meetings
    FOR SELECT USING (true);

-- 운영자만 모임 생성/수정/삭제 가능
CREATE POLICY "Admins can manage meetings" ON meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- registrations 정책
-- 본인 신청 내역 조회/수정
CREATE POLICY "Users can view own registrations" ON registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own registrations" ON registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- 운영자는 모든 신청 조회/수정 가능
CREATE POLICY "Admins can manage all registrations" ON registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- 같은 모임 참가자 수 조회용 (집계만)
CREATE POLICY "Users can count meeting participants" ON registrations
    FOR SELECT USING (status = 'confirmed');

-- waitlists 정책
CREATE POLICY "Users can view own waitlist" ON waitlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own waitlist" ON waitlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all waitlists" ON waitlists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- praises 정책
-- 본인이 보낸 칭찬 조회
CREATE POLICY "Users can view sent praises" ON praises
    FOR SELECT USING (auth.uid() = sender_id);

-- 본인이 받은 칭찬 조회 (발신자 정보 없이)
CREATE POLICY "Users can view received praises" ON praises
    FOR SELECT USING (auth.uid() = receiver_id);

-- 칭찬 보내기
CREATE POLICY "Users can send praises" ON praises
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- badges 정책
-- 본인 배지만 조회 가능
CREATE POLICY "Users can view own badges" ON badges
    FOR SELECT USING (auth.uid() = user_id);

-- 배지 부여는 시스템/운영자만
CREATE POLICY "System can grant badges" ON badges
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- bookshelf 정책
-- 본인 책장 관리
CREATE POLICY "Users can manage own bookshelf" ON bookshelf
    FOR ALL USING (auth.uid() = user_id);

-- reviews 정책
-- 본인 후기 관리
CREATE POLICY "Users can manage own reviews" ON reviews
    FOR ALL USING (auth.uid() = user_id);

-- 공개 후기는 모두 조회 가능
CREATE POLICY "Anyone can view public reviews" ON reviews
    FOR SELECT USING (is_public = true);

-- suggestions 정책
-- 본인 건의 관리
CREATE POLICY "Users can manage own suggestions" ON suggestions
    FOR ALL USING (auth.uid() = user_id);

-- 운영자는 모든 건의 조회/답변 가능
CREATE POLICY "Admins can manage all suggestions" ON suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- notification_logs 정책
-- 운영자만 알림 로그 조회 가능
CREATE POLICY "Admins can view notification logs" ON notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- 시스템(서버)은 알림 로그 생성 가능 (서비스 롤 키 사용)
CREATE POLICY "System can create notification logs" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- 인덱스
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_meeting ON registrations(meeting_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_deadline ON registrations(deposit_deadline) WHERE status = 'pending_transfer';
CREATE INDEX idx_meetings_datetime ON meetings(datetime);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_waitlists_meeting_position ON waitlists(meeting_id, position);

-- ========================================
-- 동시성 제어를 위한 함수 (M2)
-- ========================================

-- 정원 확인 후 신청 생성 (SELECT FOR UPDATE 패턴)
CREATE OR REPLACE FUNCTION create_registration_with_capacity_check(
    p_user_id UUID,
    p_meeting_id UUID,
    p_depositor_name VARCHAR(50),
    p_payment_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, message TEXT, registration_id UUID) AS $$
DECLARE
    v_capacity INTEGER;
    v_current_count INTEGER;
    v_existing_registration UUID;
    v_new_registration_id UUID;
BEGIN
    -- 트랜잭션 내에서 락 획득
    SELECT m.capacity INTO v_capacity
    FROM meetings m
    WHERE m.id = p_meeting_id
    FOR UPDATE;

    IF v_capacity IS NULL THEN
        RETURN QUERY SELECT FALSE, '모임을 찾을 수 없습니다'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- 중복 신청 확인
    SELECT id INTO v_existing_registration
    FROM registrations
    WHERE user_id = p_user_id AND meeting_id = p_meeting_id;

    IF v_existing_registration IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, '이미 신청한 모임입니다'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- 현재 확정된 참가자 수 (pending_transfer + confirmed)
    SELECT COUNT(*) INTO v_current_count
    FROM registrations
    WHERE meeting_id = p_meeting_id
    AND status IN ('pending_transfer', 'confirmed');

    IF v_current_count >= v_capacity THEN
        RETURN QUERY SELECT FALSE, '정원이 마감되었습니다'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- 신청 생성
    INSERT INTO registrations (
        user_id, meeting_id, depositor_name, payment_amount,
        status, payment_method, deposit_deadline
    ) VALUES (
        p_user_id, p_meeting_id, p_depositor_name, p_payment_amount,
        'pending_transfer', 'bank_transfer', NOW() + INTERVAL '48 hours'
    ) RETURNING id INTO v_new_registration_id;

    RETURN QUERY SELECT TRUE, '신청이 완료되었습니다'::TEXT, v_new_registration_id;
END;
$$ LANGUAGE plpgsql;

-- 48시간 만료 처리 함수 (Cron에서 호출)
CREATE OR REPLACE FUNCTION expire_pending_registrations()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE registrations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending_transfer'
    AND deposit_deadline < NOW();

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;
