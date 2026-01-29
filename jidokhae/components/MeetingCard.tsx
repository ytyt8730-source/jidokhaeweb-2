'use client'

import { Calendar, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  datetime: string
  location: string
  capacity: number
  fee: number
  currentParticipants: number
}

interface MeetingCardProps {
  meeting: Meeting
  index: number
}

export default function MeetingCard({ meeting, index }: MeetingCardProps) {
  const spotsLeft = meeting.capacity - meeting.currentParticipants
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0
  const isFull = spotsLeft === 0

  // 날짜 포맷팅
  const meetingDate = new Date(meeting.datetime)
  const formattedDate = meetingDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const formattedTime = meetingDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <article
        className="bg-bg-surface rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer hover:-translate-y-1"
        style={{
          animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
        }}
      >
        {/* 뱃지 */}
        {(isAlmostFull || isFull) && (
          <div className="mb-3">
            {isFull ? (
              <span className="inline-block px-3 py-1 bg-text-muted text-white text-xs font-bold rounded-full">
                마감
              </span>
            ) : (
              <span
                className="inline-block px-3 py-1 bg-accent text-accent-readable text-xs font-bold rounded-full"
                style={{
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                마감 임박
              </span>
            )}
          </div>
        )}

        {/* 모임 제목 */}
        <h3 className="font-bold text-lg mb-3 line-clamp-2">{meeting.title}</h3>

        {/* 메타 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <Calendar size={16} strokeWidth={1.5} />
            <span>{formattedDate}</span>
            <span className="text-text">{formattedTime}</span>
          </div>

          <div className="flex items-center gap-2 text-text-muted">
            <MapPin size={16} strokeWidth={1.5} />
            <span>{meeting.location}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-text-muted">
              <Users size={16} strokeWidth={1.5} />
              <span className="text-text font-semibold">
                {meeting.currentParticipants}명 참여
              </span>
            </div>

            <div className="text-primary font-bold">
              {meeting.fee.toLocaleString()}콩
            </div>
          </div>
        </div>
      </article>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </Link>
  )
}
