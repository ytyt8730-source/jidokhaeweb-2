import { isEnvConfigured } from '@/lib/env'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MeetingCard from '@/components/MeetingCard'

export default async function MeetingsPage() {
  // 환경 변수 미설정 시 로그인 페이지로 리다이렉트
  if (!isEnvConfigured()) {
    redirect('/auth/login?error=env_not_configured')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/meetings')
  }

  // 사용자 정보 가져오기 (운영자 권한 확인)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin'

  // 모임 목록 가져오기
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      *,
      registrations (
        id,
        status
      )
    `)
    .eq('status', 'open')
    .order('datetime', { ascending: true })

  // 각 모임의 참가 인원 계산
  const meetingsWithCount = meetings?.map((meeting) => ({
    ...meeting,
    currentParticipants: meeting.registrations?.filter(
      (r: { id: string; status: string }) => r.status === 'confirmed' || r.status === 'pending'
    ).length || 0,
  }))

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">모임 목록</h1>
            <p className="text-text-muted">참여하고 싶은 모임을 선택하세요</p>
          </div>

          {isAdmin && (
            <Link
              href="/meetings/create"
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
            >
              모임 생성
            </Link>
          )}
        </div>

        {meetingsWithCount && meetingsWithCount.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetingsWithCount.map((meeting, index) => (
              <MeetingCard key={meeting.id} meeting={meeting} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-muted">등록된 모임이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
