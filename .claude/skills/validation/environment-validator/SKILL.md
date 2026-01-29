---
name: environment-validator
description: 환경 변수 플레이스홀더 감지 및 검증. .env 파일의 완전성과 유효성을 확인.
category: validation
compatible_agents: [auditor, executor]
dependencies: []
dna:
  lineage: [root]
  generation: 1
  mutations: []
  fitness_score: 0.5
---

# Environment Validator

> .env 파일의 환경 변수 완전성 및 유효성 검증

## 목적

개발/배포 전 환경 변수 설정 오류를 사전에 감지하여:
- 플레이스홀더가 실제 값으로 교체되었는지 확인
- 필수 변수 누락 방지
- 잘못된 형식의 값 조기 발견

---

## 검증 규칙

### 1. 파일 존재 검증

| 검사 | 조건 | 상태 |
|------|------|:----:|
| .env 존재 | 파일 있음 | PASS |
| .env 부재 | 파일 없음 | FAIL |

### 2. 변수 완전성 검증

```
비교: .env.example vs .env

누락 변수 = example에 있으나 .env에 없음
추가 변수 = .env에만 있음 (WARN, 정보성)
```

### 3. 플레이스홀더 패턴 감지

| 패턴 | 예시 | 상태 |
|------|------|:----:|
| `your-*`, `your_*` | `your-api-key` | FAIL |
| `example-*`, `example_*` | `example_secret` | FAIL |
| `changeme` | `changeme` | FAIL |
| `placeholder` | `placeholder` | FAIL |
| `xxx`, `yyy`, `zzz` | `xxx-key-xxx` | FAIL |
| `TODO`, `FIXME` | `TODO: set this` | FAIL |

**정규식:**
```regex
(your[-_]|example[-_]|changeme|placeholder|xxx|yyy|zzz|TODO|FIXME)
```

### 4. URL 형식 검증

`*_URL` 패턴 변수에 적용:

| 검사 | 조건 | 상태 |
|------|------|:----:|
| 프로토콜 | `http://` 또는 `https://` | PASS/FAIL |
| 도메인 | 유효한 형식 | PASS/FAIL |
| localhost 허용 | NODE_ENV=development 시 | PASS |

### 5. 빈 값 검증

| 상황 | 상태 |
|------|:----:|
| 값 없음 (`KEY=`) | WARN |
| 공백만 (`KEY=   `) | WARN |
| 따옴표만 (`KEY=""`) | WARN |

---

## 출력 형식

### 상태 정의

| 상태 | 의미 | 액션 |
|:----:|------|------|
| PASS | 모든 검증 통과 | 진행 가능 |
| WARN | 권장사항 미충족 | 진행 가능, 검토 권장 |
| FAIL | 필수 검증 실패 | 수정 필요 |

### 출력 템플릿

```
## Environment Validation Report

Status: [PASS|WARN|FAIL]

### File Check
- .env: [Found|Missing]
- .env.example: [Found|Missing]

### Variable Coverage
- Total in example: N
- Found in .env: N
- Missing: N

### Issues Found

#### FAIL (Must Fix)
- [VAR_NAME]: [이유]

#### WARN (Review Recommended)
- [VAR_NAME]: [이유]

### Summary
[요약 메시지]
```

---

## 사용 예시

### 예시 1: 플레이스홀더 미교체

**입력 (.env):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**검증 결과:**
```
Status: FAIL

### Issues Found

#### FAIL (Must Fix)
- SUPABASE_URL: 플레이스홀더 감지 (your-project)
- SUPABASE_KEY: 플레이스홀더 감지 (your-anon-key)

### Summary
2개 환경 변수에 플레이스홀더가 남아있습니다.
실제 값으로 교체 후 다시 검증하세요.
```

### 예시 2: 변수 누락

**입력:**
```
.env.example: 10개 변수
.env: 7개 변수 (3개 누락)
```

**검증 결과:**
```
Status: FAIL

### Variable Coverage
- Total in example: 10
- Found in .env: 7
- Missing: 3

#### FAIL (Must Fix)
- PORTONE_WEBHOOK_SECRET: 누락
- SOLAPI_API_KEY: 누락
- SOLAPI_API_SECRET: 누락

### Summary
3개 필수 변수가 누락되었습니다.
.env.example을 참조하여 추가하세요.
```

### 예시 3: 모든 검증 통과

**검증 결과:**
```
Status: PASS

### File Check
- .env: Found
- .env.example: Found

### Variable Coverage
- Total in example: 10
- Found in .env: 10
- Missing: 0

### Issues Found
None

### Summary
모든 환경 변수가 올바르게 설정되었습니다.
```

---

## 검증 실행 방법

### Claude에게 요청

```
"환경 변수 검증해줘"
".env 파일 확인해줘"
"배포 전 환경 설정 점검해줘"
```

### 검증 순서

```
1. .env 파일 존재 확인
2. .env.example 파일 존재 확인
3. 변수 목록 비교
4. 각 변수값 패턴 검사
5. URL 형식 검증
6. 결과 리포트 생성
```

---

## 제약 조건

- .env 파일 내용을 출력하지 않음 (보안)
- 실제 API 연결 테스트는 수행하지 않음
- 비밀번호 강도 검사는 미포함
- .env.local, .env.production 등 변형은 별도 요청 시 검증

---

## 관련 스킬

- security-rules: 보안 관련 추가 검증
- deployment-checklist: 배포 전 전체 점검
