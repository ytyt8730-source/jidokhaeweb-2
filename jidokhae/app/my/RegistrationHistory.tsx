'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react'
import CancelModal from '@/components/CancelModal'
import type { RegistrationStatus } from '@/lib/database.types'

interface Registration {
  id: string
  status: RegistrationStatus
  payment_amount: number | null
  deposit_deadline: string | null
  cancelled_at: string | null
  created_at: string
  meetings: {
    id: string
    title: string
    datetime: string
    location: string
    fee: number
  } | null
}

interface Waitlist {
  id: string
  position: number
  created_at: string
  meetings: {
    id: string
    title: string
    datetime: string
    location: string
    fee: number
  } | null
}

interface Props {
  registrations: Registration[]
  waitlists: Waitlist[]
}

const STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string }> = {
  pending_transfer: { label: '입금 대기', color: 'bg-accent text-accent-readable' },
  confirmed: { label: '신청 완료', color: 'bg-green-500 text-white' },
  cancelled: { label: '취소됨', color: 'bg-text-muted text-white' },
  expired: { label: '만료됨', color: 'bg-danger text-white' },
  waiting: { label: '대기 중', color: 'bg-blue-500 text-white' },
}

export default function RegistrationHistory({ registrations, waitlists }: Props) {
  const router = useRouter()
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    registration: Registration | null
  }>({ isOpen: false, registration: null })

  const getRemainingTime = (deadline: string | null) => {
    if (!deadline) return null
    const remaining = new Date(deadline).getTime() - Date.now()
    if (remaining <= 0) return '만료됨'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}시간 ${minutes}분`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canCancel = (reg: Registration) => {
    if (!reg.meetings) return false
    // 모임 시작 전에만 취소 가능
    const meetingDate = new Date(reg.meetings.datetime)
    return (
      ['pending_transfer', 'confirmed'].includes(reg.status) &&
      meetingDate > new Date()
    )
  }

  const handleCancelClick = (reg: Registration) => {
    setCancelModal({ isOpen: true, registration: reg })
  }

  const handleCancelSuccess = () => {
    router.refresh()
  }

  const allItems = [
    ...registrations.map(r => ({ type: 'registration' as const, data: r, createdAt: r.created_at })),
    ...waitlists.map(w => ({ type: 'waitlist' as const, data: w, createdAt: w.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (allItems.length === 0) {
    return (
      <div className="bg-bg-surface rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">신청 내역</h2>
        <p className="text-text-muted text-center py-8">
          아직 신청 내역이 없습니다
        </p>
        <Link
          href="/meetings"
          className="block text-center text-primary font-medium hover:underline"
        >
          모임 둘러보기
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="bg-bg-surface rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">신청 내역</h2>

        <div className="space-y-4">
          {allItems.map((item) => {
            if (item.type === 'registration') {
              const reg = item.data as Registration
              if (!reg.meetings) return null

              const statusConfig = STATUS_CONFIG[reg.status]
              const remaining = getRemainingTime(reg.deposit_deadline)

              return (
                <div key={`reg-${reg.id}`} className="border border-border rounded-xl p-4">
                  {/* 상태 뱃지 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {reg.status === 'pending_transfer' && remaining && (
                      <span className="text-xs text-accent font-medium">
                        {remaining} 남음
                      </span>
                    )}
                  </div>

                  {/* 모임 정보 */}
                  <Link href={`/meetings/${reg.meetings.id}`} className="block group">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {reg.meetings.title}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(reg.meetings.datetime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatTime(reg.meetings.datetime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{reg.meetings.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-semibold text-primary">
                        {reg.payment_amount?.toLocaleString() || reg.meetings.fee.toLocaleString()}원
                      </span>
                      <ChevronRight size={18} className="text-text-muted" />
                    </div>
                  </Link>

                  {/* 취소 버튼 */}
                  {canCancel(reg) && (
                    <button
                      onClick={() => handleCancelClick(reg)}
                      className="w-full mt-3 py-2 border border-danger text-danger rounded-lg text-sm font-medium hover:bg-danger/10"
                    >
                      취소하기
                    </button>
                  )}
                </div>
              )
            } else {
              const wait = item.data as Waitlist
              if (!wait.meetings) return null

              return (
                <div key={`wait-${wait.id}`} className="border border-border rounded-xl p-4">
                  {/* 상태 뱃지 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                      대기 {wait.position}번
                    </span>
                  </div>

                  {/* 모임 정보 */}
                  <Link href={`/meetings/${wait.meetings.id}`} className="block group">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {wait.meetings.title}
                    </h3>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(wait.meetings.datetime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatTime(wait.meetings.datetime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-semibold text-primary">
                        {wait.meetings.fee.toLocaleString()}원
                      </span>
                      <ChevronRight size={18} className="text-text-muted" />
                    </div>
                  </Link>
                </div>
              )
            }
          })}
        </div>
      </div>

      {/* 취소 모달 */}
      {cancelModal.registration && (
        <CancelModal
          isOpen={cancelModal.isOpen}
          onClose={() => setCancelModal({ isOpen: false, registration: null })}
          registration={{
            id: cancelModal.registration.id,
            meetingTitle: cancelModal.registration.meetings?.title || '',
            paymentAmount: cancelModal.registration.payment_amount || 0,
            status: cancelModal.registration.status,
          }}
          onSuccess={handleCancelSuccess}
        />
      )}
    </>
  )
}
