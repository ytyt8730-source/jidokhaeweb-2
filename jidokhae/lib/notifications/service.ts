/**
 * 알림 서비스 추상화 레이어
 * M3: 알림 시스템
 */

import { NotificationService, NotificationRequest, NotificationResult } from './types';
import { SolapiNotificationService } from './solapi';

/**
 * 알림 서비스 팩토리
 *
 * 환경 변수에 따라 적절한 알림 서비스 구현체를 반환합니다.
 */
export function getNotificationService(): NotificationService {
  // 현재는 솔라피만 지원
  // 추후 NHN Cloud 등 다른 서비스 추가 시 환경 변수로 분기
  return new SolapiNotificationService();
}

/**
 * 알림 발송 헬퍼 함수
 */
export async function sendNotification(
  request: NotificationRequest
): Promise<NotificationResult> {
  const service = getNotificationService();
  return await service.send(request);
}

/**
 * 알림 서비스 연결 테스트
 */
export async function testNotificationService(): Promise<boolean> {
  const service = getNotificationService();
  return await service.test();
}
