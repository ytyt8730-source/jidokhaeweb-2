import { isEnvConfigured } from '@/lib/env'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import RegistrationHistory from './RegistrationHistory'

export default async function MyPage() {
  if (!isEnvConfigured()) {
    redirect('/auth/login?error=env_not_configured')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/my')
  }

  // users 테이블에서 사용자 정보 가져오기
  const { data: userData } = await supabase
    .from('users')
    .select('name, nickname, email')
    .eq('id', user.id)
    .single()

  // 신청 내역 가져오기
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      payment_amount,
      deposit_deadline,
      cancelled_at,
      created_at,
      meetings (
        id,
        title,
        datetime,
        location,
        fee
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 대기 내역 가져오기
  const { data: waitlists } = await supabase
    .from('waitlists')
    .select(`
      id,
      position,
      created_at,
      meetings (
        id,
        title,
        datetime,
        location,
        fee
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

        <div className="bg-bg-surface rounded-2xl p-6 shadow-card mb-6">
          <h2 className="text-xl font-semibold mb-4">내 정보</h2>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-text-muted">실명</span>
              <p className="font-medium">{userData?.name || '-'}</p>
            </div>

            <div>
              <span className="text-sm text-text-muted">닉네임</span>
              <p className="font-medium">{userData?.nickname || '-'}</p>
            </div>

            <div>
              <span className="text-sm text-text-muted">이메일</span>
              <p className="font-medium">{userData?.email || user.email}</p>
            </div>
          </div>
        </div>

        {/* 신청 내역 */}
        <RegistrationHistory
          registrations={(registrations || []) as unknown as Parameters<typeof RegistrationHistory>[0]['registrations']}
          waitlists={(waitlists || []) as unknown as Parameters<typeof RegistrationHistory>[0]['waitlists']}
        />

        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
