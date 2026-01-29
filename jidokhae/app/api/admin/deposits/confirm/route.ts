import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // 운영자 권한 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json({ error: '신청 ID가 필요합니다' }, { status: 400 })
    }

    // 신청 정보 확인
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, status, user_id, meeting_id')
      .eq('id', registrationId)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: '신청을 찾을 수 없습니다' }, { status: 404 })
    }

    if (registration.status !== 'pending_transfer') {
      return NextResponse.json(
        { error: '입금 대기 상태가 아닙니다' },
        { status: 400 }
      )
    }

    // 입금 확인 처리
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: '입금이 확인되었습니다',
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin Deposit Confirm Error]', error)
    }
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
