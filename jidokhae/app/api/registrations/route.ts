import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 입금자명 정규식: MMDD_실명
const DEPOSITOR_NAME_REGEX = /^\d{4}_[가-힣]{2,10}$/

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { meetingId, depositorName, paymentAmount } = body

    // 유효성 검사
    if (!meetingId || !depositorName || !paymentAmount) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    if (!DEPOSITOR_NAME_REGEX.test(depositorName)) {
      return NextResponse.json(
        { error: '입금자명 형식이 올바르지 않습니다 (예: 0125_홍길동)' },
        { status: 400 }
      )
    }

    // 모임 정보 확인
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, capacity, fee, status, datetime')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: '모임을 찾을 수 없습니다' }, { status: 404 })
    }

    if (meeting.status !== 'open') {
      return NextResponse.json({ error: '신청이 마감된 모임입니다' }, { status: 400 })
    }

    // RPC 함수로 동시성 제어하며 신청 생성
    // SELECT FOR UPDATE 패턴으로 정원 초과 방지
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_registration_with_capacity_check', {
        p_user_id: user.id,
        p_meeting_id: meetingId,
        p_depositor_name: depositorName,
        p_payment_amount: paymentAmount,
      })

    // RPC 함수가 없는 경우 폴백 (개발 환경 또는 마이그레이션 전)
    if (rpcError?.code === 'PGRST202') {
      // 함수가 없으면 기존 로직 사용 (폴백)
      return await fallbackRegistration(supabase, user.id, meetingId, depositorName, paymentAmount, meeting.capacity)
    }

    if (rpcError) {
      throw rpcError
    }

    // RPC 결과 처리 (배열로 반환됨)
    const result = rpcResult?.[0]

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || '신청 처리 중 오류가 발생했습니다' },
        { status: 400 }
      )
    }

    // 48시간 후 마감
    const depositDeadline = new Date()
    depositDeadline.setHours(depositDeadline.getHours() + 48)

    return NextResponse.json({
      success: true,
      registration: {
        id: result.registration_id,
        status: 'pending_transfer',
        depositDeadline: depositDeadline.toISOString(),
      },
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Registration API Error]', error)
    }
    return NextResponse.json(
      { error: '신청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 본인 신청 내역 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')

    let query = supabase
      .from('registrations')
      .select(`
        *,
        meetings (
          id, title, datetime, location, fee
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (meetingId) {
      query = query.eq('meeting_id', meetingId)
    }

    const { data: registrations, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ registrations })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Registration GET Error]', error)
    }
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// RPC 함수가 없을 때 폴백 (개발 환경용)
async function fallbackRegistration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  meetingId: string,
  depositorName: string,
  paymentAmount: number,
  capacity: number
) {
  // 이미 신청했는지 확인
  const { data: existingReg } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('user_id', userId)
    .eq('meeting_id', meetingId)
    .single()

  if (existingReg) {
    if (existingReg.status === 'pending_transfer' || existingReg.status === 'confirmed') {
      return NextResponse.json({ error: '이미 신청한 모임입니다' }, { status: 400 })
    }
  }

  // 정원 확인
  const { data: currentRegs } = await supabase
    .from('registrations')
    .select('id')
    .eq('meeting_id', meetingId)
    .in('status', ['pending_transfer', 'confirmed'])

  if ((currentRegs?.length || 0) >= capacity) {
    return NextResponse.json({ error: '정원이 마감되었습니다' }, { status: 400 })
  }

  // 48시간 후 만료 시간
  const depositDeadline = new Date()
  depositDeadline.setHours(depositDeadline.getHours() + 48)

  // 신청 생성
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .insert({
      user_id: userId,
      meeting_id: meetingId,
      depositor_name: depositorName,
      payment_amount: paymentAmount,
      status: 'pending_transfer',
      payment_method: 'bank_transfer',
      deposit_deadline: depositDeadline.toISOString(),
    })
    .select()
    .single()

  if (regError) {
    if (regError.code === '23505') {
      return NextResponse.json({ error: '이미 신청한 모임입니다' }, { status: 400 })
    }
    throw regError
  }

  return NextResponse.json({
    success: true,
    registration: {
      id: registration.id,
      status: registration.status,
      depositDeadline: registration.deposit_deadline,
    },
  })
}
