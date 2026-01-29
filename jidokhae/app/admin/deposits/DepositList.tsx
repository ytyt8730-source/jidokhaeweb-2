'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, User, Calendar } from 'lucide-react'

interface Deposit {
  id: string
  depositor_name: string | null
  payment_amount: number | null
  deposit_deadline: string | null
  created_at: string
  users: {
    id: string
    name: string
    nickname: string
    email: string
  } | null
  meetings: {
    id: string
    title: string
    datetime: string
  } | null
}

interface Props {
  initialDeposits: Deposit[]
}

export default function DepositList({ initialDeposits }: Props) {
  const router = useRouter()
  const [deposits, setDeposits] = useState(initialDeposits)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleConfirm = async (registrationId: string) => {
    if (!confirm('입금을 확인하시겠습니까?')) return

    setError('')
    setConfirming(registrationId)

    try {
      const response = await fetch('/api/admin/deposits/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '처리 중 오류가 발생했습니다')
        setConfirming(null)
        return
      }

      // 목록에서 제거
      setDeposits(deposits.filter(d => d.id !== registrationId))
      router.refresh()
    } catch {
      setError('처리 중 오류가 발생했습니다')
    } finally {
      setConfirming(null)
    }
  }

  const getRemainingTime = (deadline: string | null) => {
    if (!deadline) return null
    const remaining = new Date(deadline).getTime() - Date.now()
    if (remaining <= 0) return '만료됨'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}시간 ${minutes}분 남음`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (deposits.length === 0) {
    return (
      <div className="bg-bg-surface rounded-2xl p-12 text-center">
        <p className="text-text-muted">입금 대기 중인 신청이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {deposits.map((deposit) => (
        <div
          key={deposit.id}
          className="bg-bg-surface rounded-xl p-6 shadow-card"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 신청 정보 */}
            <div className="flex-1">
              {/* 모임 정보 */}
              <p className="font-semibold text-lg mb-2">
                {deposit.meetings?.title || '모임 정보 없음'}
              </p>

              {/* 신청자 정보 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>
                    {deposit.users?.name || '이름 없음'}
                    {deposit.users?.nickname && (
                      <span className="text-text-muted"> ({deposit.users.nickname})</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(deposit.created_at)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span className={
                    getRemainingTime(deposit.deposit_deadline) === '만료됨'
                      ? 'text-danger'
                      : 'text-accent'
                  }>
                    {getRemainingTime(deposit.deposit_deadline)}
                  </span>
                </div>
              </div>

              {/* 입금자명 & 금액 */}
              <div className="mt-3 flex items-center gap-4">
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                  <span className="text-sm text-text-muted">입금자명: </span>
                  <span className="font-bold text-primary">
                    {deposit.depositor_name || '미입력'}
                  </span>
                </div>
                <div className="font-semibold">
                  {deposit.payment_amount?.toLocaleString()}원
                </div>
              </div>
            </div>

            {/* 확인 버튼 */}
            <button
              onClick={() => handleConfirm(deposit.id)}
              disabled={confirming === deposit.id}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
            >
              {confirming === deposit.id ? (
                '처리 중...'
              ) : (
                <>
                  <Check size={20} />
                  입금 확인
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
