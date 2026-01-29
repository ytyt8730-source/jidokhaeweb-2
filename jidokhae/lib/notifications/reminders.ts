/**
 * 모임 리마인드 알림 로직
 * M3 Phase 2: 모임 리마인드 알림
 */

import { createServiceRoleClient } from '../supabase/server';
import { sendNotification, saveNotificationLog, isDuplicateNotification } from './';
import { NotificationType } from './types';
import { logger } from '../logger';


/**
 * 모임 리마인드 발송
 * @param daysBefor meeting 몇 일 전 (0: 당일, 1: 1일 전, 3: 3일 전)
 */
export async function sendMeetingReminders(daysBefore: number): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let sentCount = 0;

  try {
    logger.info('모임 리마인드 발송 시작', { daysBefore });

    // 리마인드 타입 결정
    let notificationType: string;
    let templateCode: string;

    switch (daysBefore) {
      case 3:
        notificationType = NotificationType.MEETING_REMINDER_3DAYS;
        templateCode = 'MEETING_REMINDER_3DAYS'; // 카카오 템플릿 코드
        break;
      case 1:
        notificationType = NotificationType.MEETING_REMINDER_1DAY;
        templateCode = 'MEETING_REMINDER_1DAY';
        break;
      case 0:
        notificationType = NotificationType.MEETING_REMINDER_TODAY;
        templateCode = 'MEETING_REMINDER_TODAY';
        break;
      default:
        throw new Error(`지원하지 않는 리마인드 일수: ${daysBefore}`);
    }

    // 대상 조회: N일 후 모임이 있는 confirmed 참가자
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const targetDateStart = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
    const targetDateEnd = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

    const { data: targets, error: queryError } = await supabase
      .from('registrations')
      .select(`
        user_id,
        meeting_id,
        users:user_id (
          phone,
          name,
          nickname
        ),
        meetings:meeting_id (
          title,
          datetime,
          location
        )
      `)
      .eq('status', 'confirmed')
      .gte('meetings.datetime', targetDateStart)
      .lte('meetings.datetime', targetDateEnd);

    if (queryError) {
      logger.error('리마인드 대상 조회 실패', { error: queryError });
      return { success: false, sentCount: 0, errors: [queryError.message] };
    }

    if (!targets || targets.length === 0) {
      logger.info('리마인드 대상 없음', { daysBefore });
      return { success: true, sentCount: 0, errors: [] };
    }

    logger.info('리마인드 대상 조회 완료', {
      targetCount: targets.length,
      daysBefore,
    });

    // 각 대상에게 알림 발송
    for (const target of targets) {
      try {
        // Supabase join 결과는 배열이 아닌 단일 객체로 반환될 수 있음
        const rawUser = target.users;
        const rawMeeting = target.meetings;

        const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { phone: string; name: string; nickname: string } | null;
        const meeting = (Array.isArray(rawMeeting) ? rawMeeting[0] : rawMeeting) as { title: string; datetime: string; location: string } | null;

        if (!user?.phone || !meeting) {
          if (!user?.phone) {
            logger.warn('전화번호 없음', { userId: target.user_id });
            errors.push(`전화번호 없음: ${target.user_id}`);
          }
          if (!meeting) {
            logger.warn('모임 정보 없음', { meetingId: target.meeting_id });
            errors.push(`모임 정보 없음: ${target.meeting_id}`);
          }
          continue;
        }

        // 중복 발송 확인
        const isDuplicate = await isDuplicateNotification(
          target.user_id,
          notificationType,
          target.meeting_id
        );

        if (isDuplicate) {
          logger.info('중복 발송 방지', {
            userId: target.user_id,
            meetingId: target.meeting_id,
            notificationType,
          });
          continue;
        }

        // 알림 발송
        const result = await sendNotification({
          recipient: user.phone,
          templateCode,
          variables: {
            nickname: user.nickname,
            meeting_title: meeting.title,
            meeting_datetime: formatDatetime(meeting.datetime),
            meeting_location: meeting.location,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: target.user_id,
          notificationType,
          meetingId: target.meeting_id,
          recipient: user.phone,
          messageContent: `${meeting.title} 리마인드 (D-${daysBefore})`,
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${user.nickname} - ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        errors.push(errorMsg);
        logger.error('개별 리마인드 발송 실패', { error, target });
      }
    }

    logger.info('모임 리마인드 발송 완료', {
      daysBefore,
      totalTargets: targets.length,
      sentCount,
      errorCount: errors.length,
    });

    return {
      success: true,
      sentCount,
      errors,
    };
  } catch (error) {
    logger.error('모임 리마인드 발송 중 오류', { error });
    return {
      success: false,
      sentCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}

/**
 * 날짜 시간 포맷팅
 */
function formatDatetime(datetime: string): string {
  const date = new Date(datetime);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${month}월 ${day}일(${dayOfWeek}) ${hours}:${minutes.toString().padStart(2, '0')}`;
}
