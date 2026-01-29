import { isEnvConfigured } from '@/lib/env'
import Link from 'next/link'

export default async function HomePage() {
  let user = null

  // 환경 변수가 올바르게 설정된 경우에만 Supabase 연결 시도
  if (isEnvConfigured()) {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch {
      // Supabase 연결 실패 시 로그인 안 된 상태로 처리
      user = null
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          지독해
        </h1>
        <p className="text-lg text-text-muted">
          깊은 사유, 새로운 관점
        </p>
        <p className="text-sm text-text-muted mt-2">
          경주와 포항에서 매주 열리는 프라이빗 독서 클럽
        </p>

        <div className="mt-8 space-y-3">
          {user ? (
            <>
              <p className="text-sm text-primary font-medium">로그인 상태입니다</p>
              <Link
                href="/my"
                className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
              >
                마이페이지
              </Link>
            </>
          ) : (
            <div className="flex gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-2.5 border border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
