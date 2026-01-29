'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function SetupNicknameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateNickname = (value: string): string | null => {
    if (value.length < 2) return '닉네임은 2자 이상이어야 합니다'
    if (value.length > 20) return '닉네임은 20자 이하여야 합니다'
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
      return '닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateNickname(nickname)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('로그인이 필요합니다')
        router.push('/auth/login')
        return
      }

      // 닉네임 중복 확인
      const { data: existingNickname } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', user.id)
        .single()

      if (existingNickname) {
        setError('이미 사용 중인 닉네임입니다')
        setLoading(false)
        return
      }

      // 사용자 정보 업데이트 또는 생성
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || nickname,
          nickname: nickname,
          auth_type: 'kakao',
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        if (upsertError.message.includes('nickname')) {
          setError('이미 사용 중인 닉네임입니다')
        } else {
          setError('저장 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      router.push(next)
      router.refresh()
    } catch {
      setError('처리 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">닉네임 설정</h1>
          <p className="text-text-muted">
            지독해에서 사용할 닉네임을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-surface rounded-2xl p-6 shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium mb-1.5">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="2~20자 (한글, 영문, 숫자)"
              maxLength={20}
            />
            <p className="mt-1.5 text-xs text-text-muted">
              다른 회원들에게 표시되는 이름입니다
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || nickname.length < 2}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetupNicknamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SetupNicknameForm />
    </Suspense>
  )
}
