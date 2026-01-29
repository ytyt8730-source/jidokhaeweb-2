// 환경 변수 검증 유틸리티

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

type EnvVar = (typeof requiredEnvVars)[number]

function getEnvVar(name: EnvVar): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`환경 변수 ${name}이(가) 설정되지 않았습니다.`)
  }

  // 플레이스홀더 값 감지
  if (value.includes('your-') || value.includes('YOUR_')) {
    throw new Error(
      `환경 변수 ${name}이(가) 플레이스홀더 값입니다. 실제 값으로 설정해주세요.`
    )
  }

  return value
}

export function getSupabaseUrl(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const name of requiredEnvVars) {
    try {
      getEnvVar(name)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function isEnvConfigured(): boolean {
  return validateEnv().valid
}
