/**
 * 알림 발송 이력 조회 API
 * M3 Phase 4: 운영자 알림 관리
 *
 * GET /api/admin/notifications/logs?status=failed&limit=20&offset=0
 *
 * Query Parameters:
 * - status?: 'success' | 'failed'
 * - limit?: number (default: 20)
 * - offset?: number (default: 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    // Query Parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    logger.info('알림 이력 조회', { status, limit, offset });

    const serviceSupabase = createServiceRoleClient();

    // 알림 로그 조회
    let query = serviceSupabase
      .from('notification_logs')
      .select(
        `
        id,
        notification_type,
        recipient,
        message_content,
        sent_at,
        status,
        error_message,
        users:user_id (
          id,
          nickname
        ),
        meetings:meeting_id (
          id,
          title
        )
      `,
        { count: 'exact' }
      )
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('알림 이력 조회 실패', { error });
      return NextResponse.json(
        { error: '알림 이력 조회 실패' },
        { status: 500 }
      );
    }

    logger.info('알림 이력 조회 성공', { count, dataLength: data?.length });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    });
  } catch (error) {
    logger.error('알림 이력 조회 API 오류', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
