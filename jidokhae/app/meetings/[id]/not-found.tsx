import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MeetingNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">모임을 찾을 수 없습니다</h1>
        <p className="text-text-muted mb-8">
          요청하신 모임이 존재하지 않거나 삭제되었습니다.
        </p>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
          <span>모임 목록으로</span>
        </Link>
      </div>
    </div>
  )
}
