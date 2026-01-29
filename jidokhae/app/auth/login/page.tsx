'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  const errorParam = searchParams.get('error')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          // 이메일이 존재하는지 확인
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', formData.email)
            .single()

          if (!userData) {
            setError('등록되지 않은 이메일입니다')
          } else {
            setError('비밀번호가 올바르지 않습니다')
          }
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // 로그인 성공
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다')
      // 에러는 logger를 통해 처리 (프로덕션에서는 외부 서비스로 전송)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Login Error]', err)
      }
      setLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    setError('')
    setKakaoLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setKakaoLoading(false)
      }
      // 성공 시 카카오 페이지로 리다이렉트됨
    } catch {
      setError('카카오 로그인 중 오류가 발생했습니다')
      setKakaoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">로그인</h1>
          <p className="text-text-muted">지독해에 다시 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleLogin} className="bg-bg-surface rounded-2xl p-6 shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-text-muted mt-4">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">
              회원가입
            </Link>
          </p>

          {/* 소셜 로그인 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-surface text-text-muted">또는</span>
            </div>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            className="w-full py-3 bg-[#FEE500] text-[#191919] rounded-lg font-semibold hover:bg-[#FDD800] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.02944 2 1 5.16267 1 9.09091C1 11.5744 2.5584 13.7644 4.93152 15.0298L4.07744 18.3562C4.01168 18.6098 4.30176 18.8098 4.52448 18.6618L8.4 16.0909C8.92448 16.1498 9.45824 16.1818 10 16.1818C14.9706 16.1818 19 13.0191 19 9.09091C19 5.16267 14.9706 2 10 2Z" fill="#191919"/>
            </svg>
            {kakaoLoading ? '처리 중...' : '카카오로 시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
