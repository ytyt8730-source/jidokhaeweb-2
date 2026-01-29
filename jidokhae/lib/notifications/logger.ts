/**
 * 알림 발송 로그 저장
 * M3: 알림 시스템
 */

import { createServiceRoleClient } from '../supabase/server';
import { NotificationLog } from './types';
import { logger } from '../logger';

/**
 * 알림 발송 로그 저장
 */
export async function saveNotificationLog(log: NotificationLog): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from('notification_logs').insert({
      user_id: log.userId,
      notification_type: log.notificationType,
      meeting_id: log.meetingId,
      recipient: log.recipient,
      message_content: log.messageContent,
      status: log.status,
      error_message: log.errorMessage,
      sent_at: log.sentAt || new Date().toISOString(),
    });

    if (error) {
      logger.error('알림 로그 저장 실패', { error, log });
    } else {
      logger.info('알림 로그 저장 성공', {
        notificationType: log.notificationType,
        recipient: log.recipient,
        status: log.status,
      });
    }
  } catch (error) {
    logger.error('알림 로그 저장 중 오류', { error, log });
  }
}

/**
 * 중복 발송 확인
 *
 * 같은 (user_id, notification_type, meeting_id) 조합으로
 * 최근 24시간 내 발송 이력이 있는지 확인
 */
export async function isDuplicateNotification(
  userId: string,
  notificationType: string,
  meetingId?: string
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .gte('sent_at', oneDayAgo)
      .limit(1);

    if (meetingId) {
      query = query.eq('meeting_id', meetingId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('중복 발송 확인 실패', { error });
      return false; // 오류 시 발송 허용
    }

    return (data && data.length > 0);
  } catch (error) {
    logger.error('중복 발송 확인 중 오류', { error });
    return false; // 오류 시 발송 허용
  }
}
