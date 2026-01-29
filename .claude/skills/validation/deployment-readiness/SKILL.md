---
name: deployment-readiness
description: 빌드 성공 후 런타임 준비 상태를 검증하는 체크리스트와 가이드
category: validation
compatible_agents: [auditor, executor]
dependencies: []
dna:
  lineage: [root]
  generation: 1
  mutations: []
  fitness_score: 0.5
---

# Deployment Readiness

> 빌드 완료 후 실제 배포/실행 가능 여부를 검증

## 목적

빌드가 성공해도 런타임에서 실패하는 경우가 많음. 이 스킬은 빌드 아티팩트 존재, 환경 변수, 서버 시작, 외부 연결까지 단계별로 검증하여 배포 준비 상태를 확인.

---

## 검증 레벨

| 항목 | basic | standard | full |
|------|:-----:|:--------:|:----:|
| 빌드 아티팩트 존재 | O | O | O |
| 빌드 에러 분석 | - | O | O |
| 환경 변수 검증 | O | O | O |
| dev 서버 시작 | - | O | O |
| 페이지 응답 확인 | - | O | O |
| 외부 서비스 연결 | - | - | O |
| 포트 가용성 | - | O | O |

### 레벨 선택 가이드

| 상황 | 권장 레벨 |
|------|----------|
| 빠른 확인 | basic |
| 일반 배포 전 | standard |
| 프로덕션 배포 전 | full |

---

## 프레임워크별 검증

### Next.js

```yaml
빌드 아티팩트:
  - .next/ 디렉토리 존재
  - .next/BUILD_ID 파일 존재
  - .next/static/ 디렉토리 존재

확인 명령:
  build: npm run build
  start: npm run dev (개발) | npm start (프로덕션)
  port: 3000 (기본)

필수 환경 변수:
  - NEXT_PUBLIC_* (클라이언트 노출)
  - 서버 전용 변수는 .env.local
```

### React (Vite)

```yaml
빌드 아티팩트:
  - dist/ 디렉토리 존재
  - dist/index.html 파일 존재
  - dist/assets/ 디렉토리 존재

확인 명령:
  build: npm run build
  start: npm run dev
  port: 5173 (기본)

필수 환경 변수:
  - VITE_* (클라이언트 노출)
```

### Node.js (일반)

```yaml
빌드 아티팩트:
  - package.json의 main 필드 확인
  - 진입점 파일 존재 (index.js, server.js 등)

확인 명령:
  start: npm start | node [진입점]
  port: 환경 변수 또는 코드에서 확인
```

---

## 검증 체크리스트

### 1. 빌드 아티팩트 (basic)

```bash
# Next.js
[ ] .next/ 디렉토리 존재
[ ] .next/BUILD_ID 존재

# Vite
[ ] dist/ 디렉토리 존재
[ ] dist/index.html 존재
```

### 2. 환경 변수 (basic)

```bash
[ ] .env 또는 .env.local 존재
[ ] 필수 변수 설정 확인
    - DATABASE_URL
    - API_KEY (있다면)
    - NODE_ENV
[ ] .env.example과 비교하여 누락 확인
```

### 3. 포트 가용성 (standard)

```bash
# Windows
netstat -ano | findstr :[PORT]

# Linux/Mac
lsof -i :[PORT]

[ ] 사용 포트 미점유 확인
[ ] 충돌 시 프로세스 종료 또는 포트 변경
```

### 4. 서버 시작 (standard)

```bash
[ ] npm run dev 실행
[ ] 에러 없이 시작
[ ] "ready" 또는 "listening" 메시지 확인
[ ] 5초 내 시작 완료
```

### 5. 페이지 응답 (standard)

```bash
# 헬스 체크
curl http://localhost:[PORT]
curl http://localhost:[PORT]/api/health

[ ] 200 OK 응답
[ ] HTML/JSON 정상 반환
[ ] 5초 내 응답
```

### 6. 외부 서비스 연결 (full)

```bash
[ ] 데이터베이스 연결 성공
[ ] 외부 API 호출 가능
[ ] 캐시 서버 연결 (있다면)
```

---

## 사용 예시

### 예시 1: basic 검증 (Next.js)

**입력:**
```
프로젝트: Next.js
레벨: basic
```

**적용:**
```bash
# 아티팩트 확인
ls .next/
cat .next/BUILD_ID

# 환경 변수 확인
cat .env.local
```

**출력:**
```
## Deployment Readiness: READY

| 항목 | 상태 |
|------|------|
| .next/ 존재 | OK |
| BUILD_ID 존재 | OK |
| .env.local 존재 | OK |
| 필수 변수 설정 | OK |

결론: 배포 준비 완료
```

### 예시 2: standard 검증 실패

**입력:**
```
프로젝트: Next.js
레벨: standard
```

**적용:**
```bash
# 서버 시작 시도
npm run dev

# 에러 발생
Error: EADDRINUSE: port 3000 already in use
```

**출력:**
```
## Deployment Readiness: NOT_READY

| 항목 | 상태 |
|------|------|
| .next/ 존재 | OK |
| 환경 변수 | OK |
| 포트 3000 | FAIL - 사용 중 |
| 서버 시작 | BLOCKED |

문제:
- 포트 3000이 다른 프로세스에서 사용 중

해결:
1. 점유 프로세스 확인: netstat -ano | findstr :3000
2. 프로세스 종료: taskkill /PID [PID] /F
3. 또는 다른 포트 사용: PORT=3001 npm run dev
```

---

## 출력 형식

### READY 상태

```markdown
## Deployment Readiness: READY

| 항목 | 상태 |
|------|------|
| 빌드 아티팩트 | OK |
| 환경 변수 | OK |
| 포트 가용성 | OK |
| 서버 시작 | OK |
| 페이지 응답 | OK |

배포 준비 완료. 다음 단계 진행 가능.
```

### NOT_READY 상태

```markdown
## Deployment Readiness: NOT_READY

| 항목 | 상태 |
|------|------|
| 빌드 아티팩트 | OK |
| 환경 변수 | FAIL |
| ... | ... |

문제:
- [문제 설명]

해결:
1. [해결 단계 1]
2. [해결 단계 2]
```

---

## 문제 해결 가이드

| 문제 | 원인 | 해결 |
|------|------|------|
| BUILD_ID 없음 | 빌드 미완료/실패 | `npm run build` 재실행 |
| .env 없음 | 환경 설정 누락 | `.env.example` 복사 후 값 설정 |
| 포트 점유 | 이전 프로세스 미종료 | 프로세스 종료 또는 포트 변경 |
| 서버 시작 실패 | 의존성 문제 | `npm install` 재실행 |
| 페이지 무응답 | 서버 크래시 | 로그 확인, 에러 수정 |
| DB 연결 실패 | 연결 문자열 오류 | DATABASE_URL 확인 |

---

## 제약 조건

- 이 스킬은 검증만 수행, 자동 수정하지 않음
- 프로덕션 환경 직접 테스트 금지 (스테이징 사용)
- 외부 서비스 검증은 개발 환경에서만 수행
- full 레벨은 시간이 오래 걸릴 수 있음 (30초+)

---

## 관련 스킬

- build-verification: 빌드 과정 검증 (이 스킬의 선행)
- environment-setup: 환경 변수 설정 가이드
