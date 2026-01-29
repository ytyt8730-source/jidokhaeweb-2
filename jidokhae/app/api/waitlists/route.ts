import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { meetingId } = body

    if (!meetingId) {
      return NextResponse.json({ error: '모임 ID가 필요합니다' }, { status: 400 })
    }

    // 모임 정보 확인
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, capacity, status')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: '모임을 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 신청했는지 확인
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('meeting_id', meetingId)
      .in('status', ['pending_transfer', 'confirmed'])
      .single()

    if (existingReg) {
      return NextResponse.json(
        { error: '이미 신청한 모임입니다' },
        { status: 400 }
      )
    }

    // 이미 대기 중인지 확인
    const { data: existingWait } = await supabase
      .from('waitlists')
      .select('id, position')
      .eq('user_id', user.id)
      .eq('meeting_id', meetingId)
      .single()

    if (existingWait) {
      return NextResponse.json(
        { error: '이미 대기 중입니다', position: existingWait.position },
        { status: 400 }
      )
    }

    // 정원이 마감되었는지 확인
    const { data: registrations } = await supabase
      .from('registrations')
      .select('id')
      .eq('meeting_id', meetingId)
      .in('status', ['pending_transfer', 'confirmed'])

    const currentCount = registrations?.length || 0

    if (currentCount < meeting.capacity) {
      return NextResponse.json(
        { error: '정원이 마감되지 않았습니다. 일반 신청을 이용해주세요.' },
        { status: 400 }
      )
    }

    // 현재 최대 대기 순번 조회
    const { data: maxPosition } = await supabase
      .from('waitlists')
      .select('position')
      .eq('meeting_id', meetingId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPosition?.position || 0) + 1

    // 대기 등록
    const { data: waitlist, error: waitError } = await supabase
      .from('waitlists')
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        position: newPosition,
      })
      .select()
      .single()

    if (waitError) {
      // 중복 키 에러
      if (waitError.code === '23505') {
        return NextResponse.json(
          { error: '이미 대기 중입니다' },
          { status: 400 }
        )
      }
      throw waitError
    }

    return NextResponse.json({
      success: true,
      waitlist: {
        id: waitlist.id,
        position: waitlist.position,
      },
      message: `대기 ${newPosition}번으로 등록되었습니다`,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Waitlist API Error]', error)
    }
    return NextResponse.json(
      { error: '대기 등록 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 본인 대기 내역 조회
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
      .from('waitlists')
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

    const { data: waitlists, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ waitlists })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Waitlist GET Error]', error)
    }
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 대기 취소
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const waitlistId = searchParams.get('id')

    if (!waitlistId) {
      return NextResponse.json({ error: '대기 ID가 필요합니다' }, { status: 400 })
    }

    // 본인 대기인지 확인
    const { data: waitlist } = await supabase
      .from('waitlists')
      .select('id, user_id')
      .eq('id', waitlistId)
      .single()

    if (!waitlist || waitlist.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 대기 삭제
    const { error: deleteError } = await supabase
      .from('waitlists')
      .delete()
      .eq('id', waitlistId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: '대기가 취소되었습니다',
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Waitlist DELETE Error]', error)
    }
    return NextResponse.json(
      { error: '대기 취소 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
