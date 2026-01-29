import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // OAuth 에러 처리
  if (error) {
    const errorMessage = errorDescription || error
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // 신규 카카오 사용자인지 확인 (닉네임 설정 필요 여부)
    if (data.user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', data.user.id)
        .single()

      // 닉네임이 없으면 닉네임 설정 페이지로
      if (!existingUser?.nickname) {
        return NextResponse.redirect(`${origin}/auth/setup-nickname?next=${encodeURIComponent(next)}`)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // code가 없는 경우
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
