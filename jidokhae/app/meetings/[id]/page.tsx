import { isEnvConfigured } from '@/lib/env'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react'
import RegistrationButton from '@/components/RegistrationButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params

  if (!isEnvConfigured()) {
    redirect('/auth/login?error=env_not_configured')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirectTo=/meetings/${id}`)
  }

  // 모임 정보 가져오기
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select(`
      *,
      registrations (
        id,
        status
      ),
      refund_policies (
        days_before,
        refund_percentage
      )
    `)
    .eq('id', id)
    .single()

  if (error || !meeting) {
    notFound()
  }

  // 참가 인원 계산 (입금 대기 + 확정)
  const currentParticipants = meeting.registrations?.filter(
    (r: { id: string; status: string }) =>
      r.status === 'confirmed' || r.status === 'pending_transfer'
  ).length || 0

  const spotsLeft = meeting.capacity - currentParticipants

  // 날짜 포맷팅
  const meetingDate = new Date(meeting.datetime)
  const formattedDate = meetingDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  const formattedTime = meetingDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // 환불 규정 정렬 (days_before 내림차순)
  const refundPolicies = meeting.refund_policies?.sort(
    (a: { days_before: number; refund_percentage: number }, b: { days_before: number; refund_percentage: number }) => b.days_before - a.days_before
  ) || []

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* 뒤로가기 */}
        <Link
          href="/meetings"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text mb-6"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
          <span>모임 목록</span>
        </Link>

        {/* 메인 카드 */}
        <div className="bg-bg-surface rounded-2xl p-8 shadow-card mb-6">
          {/* 뱃지 */}
          {spotsLeft <= 3 && (
            <div className="mb-4">
              {spotsLeft === 0 ? (
                <span className="inline-block px-3 py-1 bg-text-muted text-white text-xs font-bold rounded-full">
                  마감
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-accent text-accent-readable text-xs font-bold rounded-full">
                  마감 임박 (잔여 {spotsLeft}석)
                </span>
              )}
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-3xl font-bold mb-6">{meeting.title}</h1>

          {/* 메타 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 text-text-muted">
              <Calendar size={20} strokeWidth={1.5} />
              <div>
                <p className="text-text font-medium">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-muted">
              <Clock size={20} strokeWidth={1.5} />
              <div>
                <p className="text-text font-medium">{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-muted">
              <MapPin size={20} strokeWidth={1.5} />
              <div>
                <p className="text-text font-medium">{meeting.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-text-muted">
              <Users size={20} strokeWidth={1.5} />
              <div>
                <p className="text-text font-medium">
                  {currentParticipants}명 참여
                </p>
              </div>
            </div>
          </div>

          {/* 책 정보 (있는 경우) */}
          {meeting.book_title && (
            <div className="border-t border-border pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">이번 모임 책</h2>
              <div>
                <p className="font-medium">{meeting.book_title}</p>
                {meeting.book_author && (
                  <p className="text-text-muted text-sm">{meeting.book_author}</p>
                )}
              </div>
            </div>
          )}

          {/* 설명 */}
          {meeting.description && (
            <div className="border-t border-border pt-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">모임 소개</h2>
              <p className="text-text-muted whitespace-pre-wrap">{meeting.description}</p>
            </div>
          )}

          {/* 참가비 */}
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg">참가비</span>
              <span className="text-2xl font-bold text-primary">
                {meeting.fee.toLocaleString()}콩
              </span>
            </div>
          </div>
        </div>

        {/* 환불 규정 */}
        {refundPolicies.length > 0 && (
          <div className="bg-bg-surface rounded-2xl p-6 shadow-card mb-6">
            <h2 className="text-lg font-semibold mb-4">환불 규정</h2>
            <ul className="space-y-2">
              {refundPolicies.map((policy: { days_before: number; refund_percentage: number }, index: number) => (
                <li key={index} className="flex justify-between text-sm">
                  <span className="text-text-muted">
                    모임 {policy.days_before}일 전까지
                  </span>
                  <span className="font-medium text-primary">
                    {policy.refund_percentage}% 환불
                  </span>
                </li>
              ))}
              <li className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-text-muted">이후</span>
                <span className="font-medium text-danger">환불 불가</span>
              </li>
            </ul>
          </div>
        )}

        {/* 신청 버튼 */}
        <RegistrationButton
          meeting={{
            id: meeting.id,
            title: meeting.title,
            fee: meeting.fee,
            datetime: meeting.datetime,
            capacity: meeting.capacity,
          }}
          currentParticipants={currentParticipants}
          userId={user?.id || null}
        />
      </div>
    </div>
  )
}
