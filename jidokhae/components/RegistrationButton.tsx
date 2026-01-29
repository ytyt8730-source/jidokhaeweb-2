'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RegistrationModal from './RegistrationModal'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeParticipants } from '@/hooks/useRealtimeParticipants'
import type { RegistrationStatus } from '@/lib/database.types'

interface Props {
  meeting: {
    id: string
    title: string
    fee: number
    datetime: string
    capacity: number
  }
  currentParticipants: number
  userId: string | null
}

export default function RegistrationButton({ meeting, currentParticipants, userId }: Props) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [myRegistration, setMyRegistration] = useState<{
    status: RegistrationStatus
    deposit_deadline: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // 실시간 참가자 수 구독
  const { count: realtimeCount } = useRealtimeParticipants({
    meetingId: meeting.id,
    initialCount: currentParticipants,
  })

  const spotsLeft = meeting.capacity - realtimeCount

  useEffect(() => {
    const checkMyRegistration = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('registrations')
        .select('status, deposit_deadline')
        .eq('user_id', userId)
        .eq('meeting_id', meeting.id)
        .single()

      if (data) {
        setMyRegistration(data as { status: RegistrationStatus; deposit_deadline: string | null })
      }
      setLoading(false)
    }

    checkMyRegistration()
  }, [userId, meeting.id])

  const handleClick = () => {
    if (!userId) {
      router.push(`/auth/login?redirectTo=/meetings/${meeting.id}`)
      return
    }
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    router.refresh()
    // 내 신청 상태 업데이트
    setMyRegistration({
      status: 'pending_transfer',
      deposit_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
  }

  // 로딩 중
  if (loading) {
    return (
      <button
        disabled
        className="w-full py-4 bg-primary/50 text-white rounded-xl font-bold text-lg"
      >
        확인 중...
      </button>
    )
  }

  // 이미 신청한 경우
  if (myRegistration) {
    const { status, deposit_deadline } = myRegistration

    if (status === 'confirmed') {
      return (
        <div className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg text-center">
          신청 완료
        </div>
      )
    }

    if (status === 'pending_transfer') {
      const deadline = deposit_deadline ? new Date(deposit_deadline) : null
      const remainingHours = deadline
        ? Math.max(0, Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60)))
        : 0

      return (
        <div className="w-full py-4 bg-accent text-accent-readable rounded-xl font-bold text-lg text-center">
          <p>입금 대기 중</p>
          {deadline && (
            <p className="text-sm font-normal mt-1">
              {remainingHours}시간 내 입금 필요
            </p>
          )}
        </div>
      )
    }

    if (status === 'waiting') {
      return (
        <div className="w-full py-4 bg-text-muted text-white rounded-xl font-bold text-lg text-center">
          대기 중
        </div>
      )
    }

    if (status === 'cancelled' || status === 'expired') {
      // 취소/만료된 경우 재신청 가능하게 할 수도 있음
      return (
        <button
          onClick={handleClick}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90"
        >
          {meeting.fee.toLocaleString()}원으로 다시 신청하기
        </button>
      )
    }
  }

  // 정원 마감 - 대기 신청 가능
  if (spotsLeft === 0) {
    const handleWaitlist = async () => {
      if (!userId) {
        router.push(`/auth/login?redirectTo=/meetings/${meeting.id}`)
        return
      }

      try {
        const response = await fetch('/api/waitlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: meeting.id }),
        })

        const result = await response.json()

        if (!response.ok) {
          alert(result.error || '대기 등록 중 오류가 발생했습니다')
          return
        }

        alert(result.message)
        router.refresh()
        setMyRegistration({ status: 'waiting', deposit_deadline: null })
      } catch {
        alert('대기 등록 중 오류가 발생했습니다')
      }
    }

    return (
      <button
        onClick={handleWaitlist}
        className="w-full py-4 bg-text-muted text-white rounded-xl font-bold text-lg hover:bg-text-muted/80"
      >
        대기 신청하기
      </button>
    )
  }

  // 신청 가능
  return (
    <>
      <button
        onClick={handleClick}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90"
      >
        {meeting.fee.toLocaleString()}원으로 신청하기
      </button>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meeting={meeting}
        onSuccess={handleSuccess}
      />
    </>
  )
}
