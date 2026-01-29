import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Vercel Cron 설정: vercel.json에서 schedule 설정 필요
// 예: "schedule": "0 * * * *" (매시간 실행)

export async function GET(request: Request) {
  try {
    // Cron 인증 (Vercel Cron의 경우 CRON_SECRET 사용)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // 프로덕션에서는 인증 필수
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = await createClient()

    // 48시간 경과한 pending_transfer 신청 만료 처리
    const { data: expiredRegistrations, error: selectError } = await supabase
      .from('registrations')
      .select('id, user_id, meeting_id')
      .eq('status', 'pending_transfer')
      .lt('deposit_deadline', new Date().toISOString())

    if (selectError) {
      throw selectError
    }

    if (!expiredRegistrations || expiredRegistrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: '만료 처리할 신청이 없습니다',
        expiredCount: 0,
      })
    }

    // 만료 처리
    const expiredIds = expiredRegistrations.map(r => r.id)

    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .in('id', expiredIds)

    if (updateError) {
      throw updateError
    }

    // 로그 기록
    logger.info('입금 대기 만료 처리 완료', {
      expiredCount: expiredIds.length,
      expiredIds,
    })

    return NextResponse.json({
      success: true,
      message: `${expiredIds.length}건의 신청이 만료 처리되었습니다`,
      expiredCount: expiredIds.length,
      expiredIds,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Cron Expire Error]', error)
    }
    return NextResponse.json(
      { error: '만료 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
