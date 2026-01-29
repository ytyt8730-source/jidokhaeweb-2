/**
 * 테스트 알림 발송 API
 * M3 Phase 1: 알림 인프라 구축
 *
 * POST /api/notifications/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, saveNotificationLog } from '@/lib/notifications';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, templateCode, variables } = body;

    // 입력 검증
    if (!recipient || !templateCode) {
      return NextResponse.json(
        {
          success: false,
          error: '수신자 전화번호와 템플릿 코드는 필수입니다',
        },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (010-xxxx-xxxx)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(recipient)) {
      return NextResponse.json(
        {
          success: false,
          error: '전화번호 형식이 올바르지 않습니다 (010-1234-5678)',
        },
        { status: 400 }
      );
    }

    logger.info('테스트 알림 발송 시작', { recipient, templateCode });

    // 알림 발송
    const result = await sendNotification({
      recipient,
      templateCode,
      variables: variables || {},
    });

    // 발송 로그 저장
    await saveNotificationLog({
      notificationType: 'manual',
      recipient,
      messageContent: JSON.stringify({ templateCode, variables }),
      status: result.success ? 'success' : 'failed',
      errorMessage: result.error,
    });

    if (result.success) {
      logger.info('테스트 알림 발송 성공', { messageId: result.messageId });
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: '테스트 알림이 발송되었습니다',
      });
    } else {
      logger.error('테스트 알림 발송 실패', { error: result.error });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('테스트 알림 API 오류', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
