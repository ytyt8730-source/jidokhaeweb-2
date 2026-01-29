'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  isOpen: boolean
  onClose: () => void
  meeting: {
    id: string
    title: string
    fee: number
    datetime: string
  }
  onSuccess: () => void
}

// 계좌 정보 (환경변수에서 로드)
const BANK_ACCOUNT = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || '카카오뱅크',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '3333-12-3456789',
  holder: process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || '지독해',
}

// 입금자명 정규식: MMDD_실명 (예: 0125_홍길동)
const DEPOSITOR_NAME_REGEX = /^\d{4}_[가-힣]{2,10}$/

export default function RegistrationModal({ isOpen, onClose, meeting, onSuccess }: Props) {
  const [step, setStep] = useState<'info' | 'confirm'>('info')
  const [depositorName, setDepositorName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // 오늘 날짜로 기본 MMDD 생성
  useEffect(() => {
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setDepositorName(`${mm}${dd}_`)
  }, [isOpen])

  const validateDepositorName = (name: string): string | null => {
    if (!name) return '입금자명을 입력해주세요'
    if (!DEPOSITOR_NAME_REGEX.test(name)) {
      return '입금자명 형식이 올바르지 않습니다 (예: 0125_홍길동)'
    }
    return null
  }

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT.accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API 미지원 시 폴백
      setError('계좌번호를 복사할 수 없습니다. 직접 입력해주세요.')
    }
  }

  const handleSubmit = async () => {
    const validationError = validateDepositorName(depositorName)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('로그인이 필요합니다')
        setLoading(false)
        return
      }

      // 이미 신청했는지 확인
      const { data: existingReg } = await supabase
        .from('registrations')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('meeting_id', meeting.id)
        .single()

      if (existingReg) {
        if (existingReg.status === 'pending_transfer' || existingReg.status === 'confirmed') {
          setError('이미 신청한 모임입니다')
        } else if (existingReg.status === 'cancelled') {
          setError('취소한 모임입니다. 재신청이 필요하면 운영자에게 문의하세요.')
        }
        setLoading(false)
        return
      }

      // 신청 API 호출
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          depositorName: depositorName,
          paymentAmount: meeting.fee,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '신청 중 오류가 발생했습니다')
        setLoading(false)
        return
      }

      // 성공
      onSuccess()
      onClose()
    } catch {
      setError('신청 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-bg-surface rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-6">모임 신청</h2>

        {step === 'info' && (
          <>
            {/* 모임 정보 */}
            <div className="bg-bg-base rounded-lg p-4 mb-6">
              <p className="font-medium">{meeting.title}</p>
              <p className="text-primary font-bold text-lg mt-1">
                {meeting.fee.toLocaleString()}원
              </p>
            </div>

            {/* 계좌 정보 */}
            <div className="border border-border rounded-lg p-4 mb-6">
              <p className="text-sm text-text-muted mb-2">입금 계좌</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{BANK_ACCOUNT.bank}</p>
                  <p className="text-lg font-bold">{BANK_ACCOUNT.accountNumber}</p>
                  <p className="text-sm text-text-muted">{BANK_ACCOUNT.holder}</p>
                </div>
                <button
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span className="text-sm">{copied ? '복사됨' : '복사'}</span>
                </button>
              </div>
            </div>

            {/* 입금자명 안내 */}
            <div className="bg-accent/10 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-accent">입금자명 형식</p>
                  <p className="text-text-muted mt-1">
                    입금 시 <strong>MMDD_실명</strong> 형식으로 입금해주세요.
                    <br />
                    예: <strong>0125_홍길동</strong> (1월 25일, 홍길동)
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
            >
              입금 정보 확인했습니다
            </button>
          </>
        )}

        {step === 'confirm' && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            {/* 입금자명 입력 */}
            <div className="mb-6">
              <label htmlFor="depositorName" className="block text-sm font-medium mb-1.5">
                입금자명
              </label>
              <input
                id="depositorName"
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="0125_홍길동"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1.5 text-xs text-text-muted">
                은행 이체 시 입력한 입금자명과 동일하게 입력해주세요
              </p>
            </div>

            {/* 48시간 안내 */}
            <div className="bg-bg-base rounded-lg p-4 mb-6">
              <p className="text-sm text-text-muted">
                <strong className="text-text">48시간 이내</strong>에 입금해주세요.
                <br />
                미입금 시 신청이 자동 취소됩니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('info')}
                className="flex-1 py-3 border border-border rounded-lg font-semibold hover:bg-bg-base"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !depositorName}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '처리 중...' : '입금했습니다'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
