import { isEnvConfigured } from '@/lib/env'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DepositList from './DepositList'

export default async function AdminDepositsPage() {
  if (!isEnvConfigured()) {
    redirect('/auth/login?error=env_not_configured')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/admin/deposits')
  }

  // 운영자 권한 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
    redirect('/?error=unauthorized')
  }

  // 입금 대기 목록 조회
  const { data: pendingDeposits } = await supabase
    .from('registrations')
    .select(`
      id,
      depositor_name,
      payment_amount,
      deposit_deadline,
      created_at,
      users (
        id,
        name,
        nickname,
        email
      ),
      meetings (
        id,
        title,
        datetime
      )
    `)
    .eq('status', 'pending_transfer')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="text-text-muted hover:text-text"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">입금 확인</h1>
            <p className="text-text-muted">
              입금 대기 중인 신청 {pendingDeposits?.length || 0}건
            </p>
          </div>
        </div>

        {/* 입금 대기 목록 */}
        <DepositList initialDeposits={(pendingDeposits || []) as unknown as Parameters<typeof DepositList>[0]['initialDeposits']} />
      </div>
    </div>
  )
}
