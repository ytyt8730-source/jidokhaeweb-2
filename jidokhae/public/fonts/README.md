# 폰트 파일 위치

이 폴더에 다음 폰트 파일을 넣어주세요:

## Outfit 폰트
- Outfit-Regular.ttf (400)
- Outfit-Bold.ttf (700)
- Outfit-ExtraBold.ttf (800)

다운로드: https://fonts.google.com/specimen/Outfit

## 임시 대안
폰트 파일이 없을 경우, `app/layout.tsx`에서 Google Fonts CDN을 사용하도록 수정할 수 있습니다:

```typescript
import { Outfit } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})
```
