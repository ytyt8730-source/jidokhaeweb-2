/**
 * 세그먼트별 리마인드 알림 로직
 * M3 Phase 3: 대기자 & 세그먼트 알림
 */

import { createServiceRoleClient } from '../supabase/server';
import { sendNotification, saveNotificationLog, isDuplicateNotification } from './';
import { NotificationType } from './types';
import { logger } from '../logger';

/**
 * 월말 참여 독려 알림 발송
 * 대상: 이번 달 confirmed 모임 0건인 회원
 */
export async function sendMonthlyParticipationReminder(): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let sentCount = 0;

  try {
    logger.info('월말 참여 독려 알림 발송 시작');

    // 현재 날짜가 월말(25~31일)인지 확인
    const today = new Date();
    const dayOfMonth = today.getDate();

    if (dayOfMonth < 25) {
      logger.info('월말이 아니므로 알림 발송 생략', { dayOfMonth });
      return { success: true, sentCount: 0, errors: [] };
    }

    // 이번 달 시작/종료 날짜
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 이번 달 confirmed 모임이 없는 회원 조회
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, phone, nickname');

    if (usersError || !allUsers) {
      logger.error('회원 조회 실패', { error: usersError });
      return { success: false, sentCount: 0, errors: [usersError?.message || '회원 조회 실패'] };
    }

    for (const user of allUsers) {
      try {
        if (!user.phone) continue;

        // 이번 달 confirmed 모임 확인
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('id, meetings!inner(datetime)')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('meetings.datetime', monthStart)
          .lte('meetings.datetime', monthEnd);

        if (regError) {
          logger.error('신청 조회 실패', { error: regError, userId: user.id });
          continue;
        }

        // 이번 달 모임이 있으면 스킵
        if (registrations && registrations.length > 0) {
          continue;
        }

        // 중복 발송 확인 (30일 이내)
        const isDuplicate = await isDuplicateNotification(
          user.id,
          NotificationType.MONTHLY_PARTICIPATION_REMINDER
        );

        if (isDuplicate) {
          continue;
        }

        // 알림 발송
        const result = await sendNotification({
          recipient: user.phone,
          templateCode: 'MONTHLY_PARTICIPATION_REMINDER',
          variables: {
            nickname: user.nickname,
            month: `${today.getMonth() + 1}`,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: user.id,
          notificationType: NotificationType.MONTHLY_PARTICIPATION_REMINDER,
          recipient: user.phone,
          messageContent: '월말 참여 독려',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${user.nickname} - ${result.error}`);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }

    logger.info('월말 참여 독려 알림 발송 완료', { sentCount });

    return { success: true, sentCount, errors };
  } catch (error) {
    logger.error('월말 참여 독려 알림 발송 중 오류', { error });
    return {
      success: false,
      sentCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}

/**
 * 온보딩 이탈 위험 알림 발송
 * 대상: 첫 정기모임 참여 후 45일 경과, 두 번째 참여 없음
 */
export async function sendOnboardingAtRiskReminder(): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let sentCount = 0;

  try {
    logger.info('온보딩 이탈 위험 알림 발송 시작');

    // 45일 전 날짜
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    // 60일 전 날짜 (45~60일 사이)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 대상 회원: is_new_member = false, first_regular_meeting_at이 45~60일 전
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, nickname, first_regular_meeting_at')
      .eq('is_new_member', false)
      .not('first_regular_meeting_at', 'is', null)
      .gte('first_regular_meeting_at', sixtyDaysAgo.toISOString())
      .lte('first_regular_meeting_at', fortyFiveDaysAgo.toISOString());

    if (usersError || !users) {
      logger.error('온보딩 이탈 위험 회원 조회 실패', { error: usersError });
      return { success: false, sentCount: 0, errors: [usersError?.message || '회원 조회 실패'] };
    }

    for (const user of users) {
      try {
        if (!user.phone) continue;

        // 두 번째 참여 확인 (total_participations >= 2)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('total_participations')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          continue;
        }

        // 두 번째 참여가 있으면 스킵
        if (userData.total_participations >= 2) {
          continue;
        }

        // 중복 발송 확인
        const isDuplicate = await isDuplicateNotification(
          user.id,
          NotificationType.ONBOARDING_AT_RISK
        );

        if (isDuplicate) {
          continue;
        }

        // 알림 발송
        const result = await sendNotification({
          recipient: user.phone,
          templateCode: 'ONBOARDING_AT_RISK',
          variables: {
            nickname: user.nickname,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: user.id,
          notificationType: NotificationType.ONBOARDING_AT_RISK,
          recipient: user.phone,
          messageContent: '온보딩 이탈 위험 복귀 유도',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${user.nickname} - ${result.error}`);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }

    logger.info('온보딩 이탈 위험 알림 발송 완료', { sentCount });

    return { success: true, sentCount, errors };
  } catch (error) {
    logger.error('온보딩 이탈 위험 알림 발송 중 오류', { error });
    return {
      success: false,
      sentCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}

/**
 * 휴면 위험 알림 발송
 * 대상: 마지막 참여 완료 후 3개월 경과 (모든 모임 기준)
 */
export async function sendDormantAtRiskReminder(): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let sentCount = 0;

  try {
    logger.info('휴면 위험 알림 발송 시작');

    // 3개월 전 날짜
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 마지막 참여 완료가 3개월 이상인 회원 조회
    // (간단히 last_regular_meeting_at 기준 - 실제로는 모든 모임 기준으로 계산 필요)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, nickname, last_regular_meeting_at')
      .not('last_regular_meeting_at', 'is', null)
      .lt('last_regular_meeting_at', threeMonthsAgo.toISOString());

    if (usersError || !users) {
      logger.error('휴면 위험 회원 조회 실패', { error: usersError });
      return { success: false, sentCount: 0, errors: [usersError?.message || '회원 조회 실패'] };
    }

    for (const user of users) {
      try {
        if (!user.phone) continue;

        // 중복 발송 확인
        const isDuplicate = await isDuplicateNotification(
          user.id,
          NotificationType.DORMANT_AT_RISK
        );

        if (isDuplicate) {
          continue;
        }

        // 알림 발송
        const result = await sendNotification({
          recipient: user.phone,
          templateCode: 'DORMANT_AT_RISK',
          variables: {
            nickname: user.nickname,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: user.id,
          notificationType: NotificationType.DORMANT_AT_RISK,
          recipient: user.phone,
          messageContent: '휴면 위험 복귀 유도',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${user.nickname} - ${result.error}`);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }

    logger.info('휴면 위험 알림 발송 완료', { sentCount });

    return { success: true, sentCount, errors };
  } catch (error) {
    logger.error('휴면 위험 알림 발송 중 오류', { error });
    return {
      success: false,
      sentCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}

/**
 * 자격 만료 임박 알림 발송
 * 대상: 마지막 정기모임 참여 완료 후 5개월 경과
 */
export async function sendEligibilityExpiringReminder(): Promise<{
  success: boolean;
  sentCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let sentCount = 0;

  try {
    logger.info('자격 만료 임박 알림 발송 시작');

    // 5개월 전 날짜
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

    // 6개월 전 날짜 (5~6개월 사이)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 대상 회원: last_regular_meeting_at이 5~6개월 전
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone, nickname, last_regular_meeting_at')
      .not('last_regular_meeting_at', 'is', null)
      .gte('last_regular_meeting_at', sixMonthsAgo.toISOString())
      .lte('last_regular_meeting_at', fiveMonthsAgo.toISOString());

    if (usersError || !users) {
      logger.error('자격 만료 임박 회원 조회 실패', { error: usersError });
      return { success: false, sentCount: 0, errors: [usersError?.message || '회원 조회 실패'] };
    }

    for (const user of users) {
      try {
        if (!user.phone) continue;

        // 중복 발송 확인
        const isDuplicate = await isDuplicateNotification(
          user.id,
          NotificationType.ELIGIBILITY_EXPIRING
        );

        if (isDuplicate) {
          continue;
        }

        // 알림 발송
        const result = await sendNotification({
          recipient: user.phone,
          templateCode: 'ELIGIBILITY_EXPIRING',
          variables: {
            nickname: user.nickname,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: user.id,
          notificationType: NotificationType.ELIGIBILITY_EXPIRING,
          recipient: user.phone,
          messageContent: '자격 만료 임박 긴급 복귀 유도',
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${user.nickname} - ${result.error}`);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }

    logger.info('자격 만료 임박 알림 발송 완료', { sentCount });

    return { success: true, sentCount, errors };
  } catch (error) {
    logger.error('자격 만료 임박 알림 발송 중 오류', { error });
    return {
      success: false,
      sentCount,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
    };
  }
}
