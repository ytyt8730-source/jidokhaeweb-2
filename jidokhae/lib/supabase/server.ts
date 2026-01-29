import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseAnonKey, env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서는 cookies를 set할 수 없음
          }
        },
      },
    }
  )
}

/**
 * 서비스 롤 클라이언트 생성
 * RLS를 우회하여 모든 데이터에 접근 가능
 * 서버 사이드에서만 사용
 */
export function createServiceRoleClient() {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다')
  }

  return createSupabaseClient(
    getSupabaseUrl(),
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
