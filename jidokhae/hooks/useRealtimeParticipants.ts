'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeParticipantsOptions {
  meetingId: string
  initialCount: number
}

export function useRealtimeParticipants({
  meetingId,
  initialCount,
}: UseRealtimeParticipantsOptions) {
  const [count, setCount] = useState(initialCount)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const setupRealtime = async () => {
      // 현재 참가자 수 조회
      const { data } = await supabase
        .from('registrations')
        .select('id')
        .eq('meeting_id', meetingId)
        .in('status', ['pending_transfer', 'confirmed'])

      if (data) {
        setCount(data.length)
      }

      // Realtime 구독
      channel = supabase
        .channel(`meeting-${meetingId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `meeting_id=eq.${meetingId}`,
          },
          async () => {
            // 변경 발생 시 참가자 수 재조회
            const { data: updatedData } = await supabase
              .from('registrations')
              .select('id')
              .eq('meeting_id', meetingId)
              .in('status', ['pending_transfer', 'confirmed'])

            if (updatedData) {
              setCount(updatedData.length)
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [meetingId])

  return { count, isConnected }
}
