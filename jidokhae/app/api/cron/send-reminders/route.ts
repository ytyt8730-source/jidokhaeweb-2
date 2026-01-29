/**
 * 모임 리마인드 발송 Cron
 * M3 Phase 2: 모임 리마인드 알림
 *
 * GET /api/cron/send-reminders?days_before=3
 *
 * Query Parameters:
 * - days_before: 모임 몇 일 전 (0, 1, 3)
 *
 * Vercel Cron 설정 (vercel.json):
 * - 매일 오전 7시 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMeetingReminders } from '@/lib/notifications/reminders';
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

    // Query Parameter에서 days_before 가져오기
    const searchParams = request.nextUrl.searchParams;
    const daysBeforeParam = searchParams.get('days_before');

    if (!daysBeforeParam) {
      return NextResponse.json(
        { error: 'days_before 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    const daysBefore = parseInt(daysBeforeParam, 10);

    if (![0, 1, 3].includes(daysBefore)) {
      return NextResponse.json(
        { error: 'days_before는 0, 1, 3 중 하나여야 합니다' },
        { status: 400 }
      );
    }

    logger.info('모임 리마인드 Cron 실행', { daysBefore });

    const result = await sendMeetingReminders(daysBefore);

    return NextResponse.json({
      success: result.success,
      message: `${result.sentCount}건의 리마인드 알림이 발송되었습니다`,
      sentCount: result.sentCount,
      errorCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('모임 리마인드 Cron 오류', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
