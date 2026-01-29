import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreateMeetingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/meetings/create')
  }

  // 운영자 권한 확인
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
    // 권한 없음 - 모임 목록으로 리다이렉트
    redirect('/meetings')
  }

  return <>{children}</>
}
