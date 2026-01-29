import type { Metadata } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR, Outfit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/ThemeProvider'

// Outfit - Electric 테마 로고/헤드라인용 (Google Fonts 사용)
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

// Noto Sans KR - 본문용
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
})

// Noto Serif KR - Warm 테마 로고/헤드라인용
const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '지독해 - 경주/포항 독서 모임',
  description: '깊은 사유, 새로운 관점. 경주와 포항에서 매주 열리는 프라이빗 독서 클럽',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={`${outfit.variable} ${notoSansKR.variable} ${notoSerifKR.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
