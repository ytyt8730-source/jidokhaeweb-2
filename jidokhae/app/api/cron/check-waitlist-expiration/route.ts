/**
 * 대기자 응답 시간 초과 체크 Cron
 * M3 Phase 3: 대기자 & 세그먼트 알림
 *
 * GET /api/cron/check-waitlist-expiration
 *
 * Vercel Cron 설정: 매시간 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkWaitlistExpiration } from '@/lib/notifications/waitlist';
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

    logger.info('대기자 응답 시간 초과 체크 Cron 실행');

    const result = await checkWaitlistExpiration();

    return NextResponse.json({
      success: result.success,
      message: `${result.expiredCount}명의 대기자가 만료 처리되었습니다`,
      expiredCount: result.expiredCount,
      errorCount: result.errors.length,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('대기자 응답 시간 초과 체크 Cron 오류', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
