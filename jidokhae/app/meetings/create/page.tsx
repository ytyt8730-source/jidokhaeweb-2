'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateMeetingPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    datetime: '',
    location: '',
    capacity: 12,
    fee: 5000,
    description: '',
    book_title: '',
    book_author: '',
  })
  const [refundPolicies, setRefundPolicies] = useState([
    { days_before: 5, refund_percentage: 100 },
    { days_before: 2, refund_percentage: 50 },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 유효성 검사
      if (!formData.title.trim()) {
        setError('모임명을 입력하세요')
        setLoading(false)
        return
      }

      if (!formData.datetime) {
        setError('일시를 선택하세요')
        setLoading(false)
        return
      }

      if (!formData.location.trim()) {
        setError('장소를 입력하세요')
        setLoading(false)
        return
      }

      if (formData.capacity < 1) {
        setError('정원은 1명 이상이어야 합니다')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // 권한 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
        setError('모임 생성 권한이 없습니다')
        setLoading(false)
        return
      }

      // 모임 생성
      const { data: meeting, error: insertError } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          datetime: formData.datetime,
          location: formData.location,
          capacity: formData.capacity,
          fee: formData.fee,
          description: formData.description || null,
          book_title: formData.book_title || null,
          book_author: formData.book_author || null,
          status: 'open',
          created_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // 환불 규정 추가
      if (meeting && refundPolicies.length > 0) {
        const policiesWithMeetingId = refundPolicies.map(p => ({
          meeting_id: meeting.id,
          days_before: p.days_before,
          refund_percentage: p.refund_percentage,
        }))

        await supabase.from('refund_policies').insert(policiesWithMeetingId)
      }

      // 성공 시 모임 목록으로 이동
      router.push('/meetings')
      router.refresh()
    } catch (err) {
      setError('모임 생성 중 오류가 발생했습니다')
      // 에러는 logger를 통해 처리 (프로덕션에서는 외부 서비스로 전송)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Meeting Create Error]', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const addRefundPolicy = () => {
    setRefundPolicies([...refundPolicies, { days_before: 1, refund_percentage: 0 }])
  }

  const removeRefundPolicy = (index: number) => {
    setRefundPolicies(refundPolicies.filter((_, i) => i !== index))
  }

  const updateRefundPolicy = (index: number, field: string, value: number) => {
    const updated = [...refundPolicies]
    updated[index] = { ...updated[index], [field]: value }
    setRefundPolicies(updated)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* 뒤로가기 */}
        <Link
          href="/meetings"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text mb-6"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
          <span>모임 목록</span>
        </Link>

        <h1 className="text-3xl font-bold mb-8">모임 생성</h1>

        <form onSubmit={handleSubmit} className="bg-bg-surface rounded-2xl p-6 shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1.5">
                모임명 <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1월 4주차 정기모임"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="datetime" className="block text-sm font-medium mb-1.5">
                  일시 <span className="text-danger">*</span>
                </label>
                <input
                  id="datetime"
                  type="datetime-local"
                  required
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1.5">
                  장소 <span className="text-danger">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="경주 황리단길"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium mb-1.5">
                  정원 <span className="text-danger">*</span>
                </label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="fee" className="block text-sm font-medium mb-1.5">
                  참가비 (콩)
                </label>
                <input
                  id="fee"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* 책 정보 */}
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold mb-4">책 정보 (선택)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book_title" className="block text-sm font-medium mb-1.5">
                    책 제목
                  </label>
                  <input
                    id="book_title"
                    type="text"
                    value={formData.book_title}
                    onChange={(e) => setFormData({ ...formData, book_title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="사피엔스"
                  />
                </div>

                <div>
                  <label htmlFor="book_author" className="block text-sm font-medium mb-1.5">
                    저자
                  </label>
                  <input
                    id="book_author"
                    type="text"
                    value={formData.book_author}
                    onChange={(e) => setFormData({ ...formData, book_author: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="유발 하라리"
                  />
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1.5">
                모임 소개
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="모임에 대한 소개를 입력하세요"
              />
            </div>

            {/* 환불 규정 */}
            <div className="border-t border-border pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">환불 규정</h2>
                <button
                  type="button"
                  onClick={addRefundPolicy}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  + 규정 추가
                </button>
              </div>

              <div className="space-y-3">
                {refundPolicies.map((policy, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={policy.days_before}
                      onChange={(e) => updateRefundPolicy(index, 'days_before', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                    <span className="text-text-muted">일 전까지</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={policy.refund_percentage}
                      onChange={(e) => updateRefundPolicy(index, 'refund_percentage', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                    <span className="text-text-muted">% 환불</span>
                    <button
                      type="button"
                      onClick={() => removeRefundPolicy(index)}
                      className="text-danger text-sm hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '모임 생성하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
