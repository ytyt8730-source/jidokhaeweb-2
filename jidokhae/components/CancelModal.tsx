'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import type { RegistrationStatus } from '@/lib/database.types'

interface Props {
  isOpen: boolean
  onClose: () => void
  registration: {
    id: string
    meetingTitle: string
    paymentAmount: number
    status: RegistrationStatus
  }
  onSuccess: () => void
}

const CANCEL_REASONS = [
  '일정이 변경되었습니다',
  '개인 사정으로 참석이 어렵습니다',
  '다른 모임과 겹칩니다',
  '건강상의 이유로 참석이 어렵습니다',
]

const BANKS = [
  '카카오뱅크',
  '토스뱅크',
  '국민은행',
  '신한은행',
  '하나은행',
  '우리은행',
  '농협은행',
  'SC제일은행',
  '기업은행',
  '대구은행',
  '부산은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '수협은행',
  '씨티은행',
]

export default function CancelModal({ isOpen, onClose, registration, onSuccess }: Props) {
  const [step, setStep] = useState<'reason' | 'refund'>('reason')
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundBank, setRefundBank] = useState('')
  const [refundAccount, setRefundAccount] = useState('')
  const [refundHolder, setRefundHolder] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const needsRefund = registration.status === 'confirmed'

  const handleReasonNext = () => {
    const reason = cancelReason === 'custom' ? customReason : cancelReason
    if (!reason) {
      setError('취소 사유를 선택해주세요')
      return
    }
    setError('')

    if (needsRefund) {
      setStep('refund')
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (needsRefund) {
      if (!refundBank || !refundAccount || !refundHolder) {
        setError('환불 계좌 정보를 모두 입력해주세요')
        return
      }
    }

    setError('')
    setLoading(true)

    try {
      const reason = cancelReason === 'custom' ? customReason : cancelReason

      const response = await fetch(`/api/registrations/${registration.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelReason: reason,
          refundBank: needsRefund ? refundBank : undefined,
          refundAccount: needsRefund ? refundAccount : undefined,
          refundHolder: needsRefund ? refundHolder : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '취소 처리 중 오류가 발생했습니다')
        setLoading(false)
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('취소 처리 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-bg-surface rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="text-danger" size={24} />
          <h2 className="text-xl font-bold">참가 취소</h2>
        </div>

        {/* 모임 정보 */}
        <div className="bg-bg-base rounded-lg p-4 mb-6">
          <p className="font-medium">{registration.meetingTitle}</p>
          <p className="text-primary font-bold mt-1">
            {registration.paymentAmount.toLocaleString()}원
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
            {error}
          </div>
        )}

        {step === 'reason' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                취소 사유를 선택해주세요
              </label>
              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      cancelReason === reason
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      cancelReason === reason ? 'border-primary' : 'border-border'
                    }`}>
                      {cancelReason === reason && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}

                {/* 직접 입력 */}
                <label
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    cancelReason === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-text-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value="custom"
                    checked={cancelReason === 'custom'}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    cancelReason === 'custom' ? 'border-primary' : 'border-border'
                  }`}>
                    {cancelReason === 'custom' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">직접 입력</span>
                    {cancelReason === 'custom' && (
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="취소 사유를 입력해주세요"
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={2}
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleReasonNext}
              disabled={loading}
              className="w-full py-3 bg-danger text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {needsRefund ? '다음' : (loading ? '처리 중...' : '취소하기')}
            </button>
          </>
        )}

        {step === 'refund' && (
          <>
            <div className="mb-6">
              <p className="text-sm text-text-muted mb-4">
                환불 받으실 계좌 정보를 입력해주세요.
                <br />
                운영자 확인 후 환불이 진행됩니다.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">은행</label>
                  <select
                    value={refundBank}
                    onChange={(e) => setRefundBank(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">은행 선택</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">계좌번호</label>
                  <input
                    type="text"
                    value={refundAccount}
                    onChange={(e) => setRefundAccount(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="'-' 없이 숫자만 입력"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">예금주</label>
                  <input
                    type="text"
                    value={refundHolder}
                    onChange={(e) => setRefundHolder(e.target.value)}
                    placeholder="실명 입력"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('reason')}
                className="flex-1 py-3 border border-border rounded-lg font-semibold hover:bg-bg-base"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-danger text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '처리 중...' : '취소하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
