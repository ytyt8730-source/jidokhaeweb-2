/**
 * 대기자 알림 로직
 * M3 Phase 3: 대기자 & 세그먼트 알림
 */

import { createServiceRoleClient } from '../supabase/server';
import { sendNotification, saveNotificationLog } from './';
import { NotificationType } from './types';
import { logger } from '../logger';

/**
 * 대기자에게 자리 발생 알림 발송
 * @param meetingId 모임 ID
 * @param userId 대기자 User ID (선택, 없으면 1순위 대기자에게 자동 발송)
 */
export async function notifyWaitlistSpotAvailable(
  meetingId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  try {
    logger.info('대기자 자리 발생 알림 시작', { meetingId, userId });

    // 대기자가 지정되지 않은 경우 1순위 대기자 조회
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: firstWaitlist, error: waitlistError } = await supabase
        .from('waitlists')
        .select('user_id, position')
        .eq('meeting_id', meetingId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (waitlistError || !firstWaitlist) {
        logger.info('대기자 없음', { meetingId });
        return { success: true }; // 대기자 없음은 정상 처리
      }

      targetUserId = firstWaitlist.user_id;
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, nickname')
      .eq('id', targetUserId)
      .single();

    if (userError || !user || !user.phone) {
      logger.error('대기자 정보 조회 실패', { error: userError, userId: targetUserId });
      return { success: false, error: '대기자 정보를 찾을 수 없습니다' };
    }

    // 모임 정보 조회
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('title, datetime, location')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      logger.error('모임 정보 조회 실패', { error: meetingError, meetingId });
      return { success: false, error: '모임 정보를 찾을 수 없습니다' };
    }

    // 응답 대기 시간 계산
    const responseDeadline = calculateResponseDeadline(meeting.datetime);

    // 알림 발송
    const result = await sendNotification({
      recipient: user.phone,
      templateCode: 'WAITLIST_SPOT_AVAILABLE',
      variables: {
        nickname: user.nickname,
        meeting_title: meeting.title,
        response_deadline: formatDeadline(responseDeadline),
      },
    });

    // 대기자 테이블 업데이트 (notified_at, response_deadline)
    if (result.success) {
      await supabase
        .from('waitlists')
        .update({
          notified_at: new Date().toISOString(),
          response_deadline: responseDeadline.toISOString(),
        })
        .eq('meeting_id', meetingId)
        .eq('user_id', targetUserId);
    }

    // 로그 저장
    await saveNotificationLog({
      userId: targetUserId,
      notificationType: NotificationType.WAITLIST_SPOT_AVAILABLE,
      meetingId,
      recipient: user.phone,
      messageContent: `${meeting.title} 대기자 자리 발생`,
      status: result.success ? 'success' : 'failed',
      errorMessage: result.error,
    });

    if (result.success) {
      logger.info('대기자 자리 발생 알림 발송 성공', { userId: targetUserId, meetingId });
      return { success: true };
    } else {
      logger.error('대기자 자리 발생 알림 발송 실패', { error: result.error });
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error('대기자 자리 발생 알림 중 오류', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 응답 대기 시간 초과 체크 및 다음 대기자 알림
 */
export async function checkWaitlistExpiration(): Promise<{
  success: boolean;
  expiredCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let expiredCount = 0;

  try {
    logger.info('대기자 응답 시간 초과 체크 시작');

    // 응답 시간이 지난 대기자 조회
    const now = new Date().toISOString();
    const { data: expiredWaitlists, error: queryError } = await supabase
      .from('waitlists')
      .select('id, user_id, meeting_id, position')
      .not('notified_at', 'is', null)
      .not('response_deadline', 'is', null)
      .lt('response_deadline', now);

    if (queryError) {
      logger.error('만료 대기자 조회 실패', { error: queryError });
      return { success: false, expiredCount: 0, errors: [queryError.message] };
    }

    if (!expiredWaitlists || expiredWaitlists.length === 0) {
      logger.info('만료 대기자 없음');
      return { success: true, expiredCount: 0, errors: [] };
    }

    logger.info('만료 대기자 발견', { count: expiredWaitlists.length });

    // 각 만료 대기자 처리
    for (const waitlist of expiredWaitlists) {
      try {
        // 대기자 삭제
        await supabase.from('waitlists').delete().eq('id', waitlist.id);

        // 다음 대기자에게 알림
        await notifyWaitlistSpotAvailable(waitlist.meeting_id);

        expiredCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
        errors.push(`대기자 만료 처리 실패: ${waitlist.id} - ${errorMsg}`);
        logger.error('대기자 만료 처리 실패', { error, waitlistId: waitlist.id });
      }
    }

    logger.info('대기자 응답 시간 초과 체크 완료', { expiredCount });

    return {
      success: true,
      expiredCount,
      errors,
    };
  } catch (error) {
    logger.error('대기자 응답 시간 초과 체크 중 오류', { error });
    return {
      success: false,
      expiredCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}

/**
 * 응답 대기 시간 계산
 * - 모임 3일 전 이전: 24시간
 * - 모임 3~1일 전: 6시간
 * - 모임 1일 전 이후: 2시간
 */
function calculateResponseDeadline(meetingDatetime: string): Date {
  const now = new Date();
  const meetingDate = new Date(meetingDatetime);
  const hoursUntilMeeting = (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let responseHours: number;

  if (hoursUntilMeeting >= 72) {
    // 3일(72시간) 이상
    responseHours = 24;
  } else if (hoursUntilMeeting >= 24) {
    // 1~3일
    responseHours = 6;
  } else {
    // 1일 미만
    responseHours = 2;
  }

  const deadline = new Date(now);
  deadline.setHours(deadline.getHours() + responseHours);

  return deadline;
}

/**
 * 응답 마감 시간 포맷팅
 */
function formatDeadline(deadline: Date): string {
  const month = deadline.getMonth() + 1;
  const day = deadline.getDate();
  const hours = deadline.getHours();
  const minutes = deadline.getMinutes();

  return `${month}월 ${day}일 ${hours}:${minutes.toString().padStart(2, '0')}`;
}
