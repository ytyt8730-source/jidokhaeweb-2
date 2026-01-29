import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id: registrationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { cancelReason, refundBank, refundAccount, refundHolder } = body

    if (!cancelReason) {
      return NextResponse.json({ error: '취소 사유가 필요합니다' }, { status: 400 })
    }

    // 신청 정보 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, status, user_id, meeting_id, payment_amount')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: '신청을 찾을 수 없습니다' }, { status: 404 })
    }

    // 본인 신청인지 확인
    if (registration.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 취소 가능한 상태인지 확인
    if (!['pending_transfer', 'confirmed'].includes(registration.status)) {
      return NextResponse.json(
        { error: '취소할 수 없는 상태입니다' },
        { status: 400 }
      )
    }

    // confirmed 상태면 환불 계좌 필수
    if (registration.status === 'confirmed') {
      if (!refundBank || !refundAccount || !refundHolder) {
        return NextResponse.json(
          { error: '환불 계좌 정보가 필요합니다' },
          { status: 400 }
        )
      }
    }

    // 취소 처리
    const updateData: Record<string, unknown> = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason,
      updated_at: new Date().toISOString(),
    }

    // 환불 계좌 정보 추가
    if (registration.status === 'confirmed' && refundBank) {
      updateData.refund_bank = refundBank
      updateData.refund_account = refundAccount
      updateData.refund_holder = refundHolder
      updateData.refund_amount = registration.payment_amount
    }

    const { error: updateError } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId)

    if (updateError) {
      throw updateError
    }

    // 대기자 자동 승격 처리 (M2에서는 알림만, 자동 승격은 M3+)
    // 취소 발생 시 대기자가 있으면 운영자에게 알림 메모
    const { data: waitlistEntry } = await supabase
      .from('waitlists')
      .select('id, user_id')
      .eq('meeting_id', registration.meeting_id)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    let hasWaitlist = false
    if (waitlistEntry) {
      hasWaitlist = true
      // TODO: M3에서 운영자 알림 시스템 연동
    }

    return NextResponse.json({
      success: true,
      message: '취소가 완료되었습니다',
      hasWaitlist,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Cancel Registration Error]', error)
    }
    return NextResponse.json(
      { error: '취소 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
