'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 닉네임 유효성 검사
      const nicknameRegex = /^[가-힣a-zA-Z0-9_]{2,20}$/
      if (!nicknameRegex.test(formData.nickname)) {
        setError('닉네임은 2~20자, 한글/영문/숫자/언더스코어만 가능')
        setLoading(false)
        return
      }

      // 이메일 형식 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식을 입력하세요')
        setLoading(false)
        return
      }

      // 비밀번호 길이 검사
      if (formData.password.length < 6) {
        setError('비밀번호는 6자 이상이어야 합니다')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            nickname: formData.nickname,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // 2. users 테이블에 추가 정보 저장
      if (authData.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          nickname: formData.nickname,
        })

        if (insertError) {
          if (insertError.message.includes('duplicate') || insertError.code === '23505') {
            setError('이미 사용 중인 닉네임입니다')
            // Auth 사용자도 삭제해야 하지만, Supabase는 자동으로 처리
          } else {
            setError(insertError.message)
          }
          setLoading(false)
          return
        }
      }

      // 회원가입 성공
      router.push('/auth/login')
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다')
      // 에러는 logger를 통해 처리 (프로덕션에서는 외부 서비스로 전송)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Signup Error]', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">회원가입</h1>
          <p className="text-text-muted">지독해에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSignUp} className="bg-bg-surface rounded-2xl p-6 shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                실명
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium mb-1.5">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="독서왕"
              />
              <p className="text-xs text-text-muted mt-1">
                2~20자, 한글/영문/숫자/언더스코어만 가능
              </p>
            </div>

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
                placeholder="6자 이상"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '처리 중...' : '가입하기'}
          </button>

          <p className="text-center text-sm text-text-muted mt-4">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
