/**
 * 세그먼트별 리마인드 발송 Cron
 * M3 Phase 3: 대기자 & 세그먼트 알림
 *
 * GET /api/cron/send-segment-reminders?type=monthly
 *
 * Query Parameters:
 * - type: monthly | onboarding | dormant | eligibility
 *
 * Vercel Cron 설정: 매일 오전 8시 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendMonthlyParticipationReminder,
  sendOnboardingAtRiskReminder,
  sendDormantAtRiskReminder,
  sendEligibilityExpiringReminder,
} from '@/lib/notifications/segments';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Cron Secret 검증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Cron 인증 실패');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query Parameter에서 type 가져오기
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'type 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    logger.info('세그먼트 리마인드 Cron 실행', { type });

    let result;

    switch (type) {
      case 'monthly':
        result = await sendMonthlyParticipationReminder();
        break;
      case 'onboarding':
        result = await sendOnboardingAtRiskReminder();
        break;
      case 'dormant':
        result = await sendDormantAtRiskReminder();
        break;
      case 'eligibility':
        result = await sendEligibilityExpiringReminder();
        break;
      default:
        return NextResponse.json(
          { error: '지원하지 않는 세그먼트 타입입니다' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: `${result.sentCount}건의 세그먼트 리마인드 알림이 발송되었습니다`,
      sentCount: result.sentCount,
      errorCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('세그먼트 리마인드 Cron 오류', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
