/**
 * 알림 시스템 타입 정의
 * M3: 알림 시스템
 */

/**
 * 알림 발송 결과
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 알림 발송 요청
 */
export interface NotificationRequest {
  recipient: string;      // 수신자 전화번호 (010-1234-5678 형식)
  templateCode: string;   // 카카오 알림톡 템플릿 코드
  variables: Record<string, string>;  // 템플릿 변수
}

/**
 * 알림 발송 로그
 */
export interface NotificationLog {
  id?: string;
  userId?: string;
  notificationType: string;
  meetingId?: string;
  recipient: string;
  messageContent?: string;
  sentAt?: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * 알림 서비스 인터페이스
 *
 * 알림 서비스 제공자(솔라피, NHN Cloud 등)를 추상화하여
 * 향후 쉽게 교체할 수 있도록 합니다.
 */
export interface NotificationService {
  /**
   * 알림 발송
   */
  send(request: NotificationRequest): Promise<NotificationResult>;

  /**
   * 연결 테스트
   */
  test(): Promise<boolean>;
}

/**
 * 알림 타입 (notification_type)
 */
export const NotificationType = {
  // 모임 리마인드
  MEETING_REMINDER_3DAYS: 'meeting_reminder_3days',
  MEETING_REMINDER_1DAY: 'meeting_reminder_1day',
  MEETING_REMINDER_TODAY: 'meeting_reminder_today',

  // 대기자
  WAITLIST_SPOT_AVAILABLE: 'waitlist_spot_available',
  WAITLIST_EXPIRED: 'waitlist_expired',

  // 세그먼트 리마인드
  MONTHLY_PARTICIPATION_REMINDER: 'monthly_participation_reminder',
  ONBOARDING_AT_RISK: 'onboarding_at_risk',
  DORMANT_AT_RISK: 'dormant_at_risk',
  ELIGIBILITY_EXPIRING: 'eligibility_expiring',

  // 참여 완료
  PARTICIPATION_CONFIRMATION: 'participation_confirmation',

  // 수동 발송
  MANUAL: 'manual',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];
