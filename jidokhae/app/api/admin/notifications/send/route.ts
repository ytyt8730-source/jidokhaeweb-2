/**
 * 수동 알림 발송 API
 * M3 Phase 4: 운영자 알림 관리
 *
 * POST /api/admin/notifications/send
 *
 * Body:
 * - targetType: 'all' | 'meeting' | 'user'
 * - targetId?: string (meeting ID 또는 user ID)
 * - message: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendNotification, saveNotificationLog } from '@/lib/notifications';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 운영자 권한 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Request body 파싱
    const body = await request.json();
    const { targetType, targetId, message } = body;

    // 입력 검증
    if (!targetType || !message) {
      return NextResponse.json(
        { error: '대상 타입과 메시지는 필수입니다' },
        { status: 400 }
      );
    }

    if (!['all', 'meeting', 'user'].includes(targetType)) {
      return NextResponse.json(
        { error: '대상 타입은 all, meeting, user 중 하나여야 합니다' },
        { status: 400 }
      );
    }

    if ((targetType === 'meeting' || targetType === 'user') && !targetId) {
      return NextResponse.json(
        { error: `${targetType} 타입은 targetId가 필요합니다` },
        { status: 400 }
      );
    }

    logger.info('수동 알림 발송 시작', { targetType, targetId, adminId: user.id });

    const serviceSupabase = createServiceRoleClient();
    const errors: string[] = [];
    let sentCount = 0;

    // 대상 조회
    let recipients: Array<{ id: string; phone: string; nickname: string }> = [];

    if (targetType === 'all') {
      // 전체 회원
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id, phone, nickname')
        .not('phone', 'is', null);

      if (error || !data) {
        return NextResponse.json(
          { error: '회원 조회 실패' },
          { status: 500 }
        );
      }

      recipients = data;
    } else if (targetType === 'meeting') {
      // 특정 모임 참가자
      const { data, error } = await serviceSupabase
        .from('registrations')
        .select(`
          users:user_id (
            id,
            phone,
            nickname
          )
        `)
        .eq('meeting_id', targetId)
        .eq('status', 'confirmed');

      if (error || !data) {
        return NextResponse.json(
          { error: '참가자 조회 실패' },
          { status: 500 }
        );
      }

      recipients = data
        .map((r) => {
          const rawUser = r.users;
          const user = (Array.isArray(rawUser) ? rawUser[0] : rawUser) as { id: string; phone: string; nickname: string } | null;
          return user;
        })
        .filter((u): u is { id: string; phone: string; nickname: string } => u !== null && !!u.phone);
    } else if (targetType === 'user') {
      // 개인
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id, phone, nickname')
        .eq('id', targetId)
        .single();

      if (error || !data || !data.phone) {
        return NextResponse.json(
          { error: '사용자 조회 실패' },
          { status: 500 }
        );
      }

      recipients = [data];
    }

    // 알림 발송
    for (const recipient of recipients) {
      try {
        const result = await sendNotification({
          recipient: recipient.phone,
          templateCode: 'MANUAL',
          variables: {
            nickname: recipient.nickname,
            message,
          },
        });

        // 로그 저장
        await saveNotificationLog({
          userId: recipient.id,
          notificationType: 'manual',
          recipient: recipient.phone,
          messageContent: message,
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          sentCount++;
        } else {
          errors.push(`발송 실패: ${recipient.nickname} - ${result.error}`);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      }
    }

    logger.info('수동 알림 발송 완료', { sentCount, errorCount: errors.length });

    return NextResponse.json({
      success: true,
      message: `${sentCount}건의 알림이 발송되었습니다`,
      sentCount,
      totalTargets: recipients.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    logger.error('수동 알림 발송 API 오류', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
