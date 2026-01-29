# Blueprint: environment-validator

## 요약

| 항목 | 값 |
|------|-----|
| 유형 | Skill |
| 이름 | environment-validator |
| 카테고리 | validation |
| 버전 | 1.0.0 |
| 목적 | 프로젝트 작업 전 환경 변수 상태 검증으로 런타임 에러 사전 방지 |
| 복잡도 | 중간 |

---

## 상세 설계

### 역할 정의

프로젝트의 환경 변수 설정 상태를 종합적으로 검증하여 개발/배포 시 발생할 수 있는 환경 변수 관련 오류를 사전에 감지합니다. `.env.example`과 실제 `.env` 파일을 비교하고, 플레이스홀더 패턴 및 잘못된 형식을 탐지합니다.

### 입출력 스펙

#### 입력 (Input)

```yaml
required:
  - project_root: string  # 프로젝트 루트 절대 경로

optional:
  - env_file: string      # 검증할 .env 파일 경로 (기본: .env.local)
  - example_file: string  # .env.example 경로 (기본: .env.example)
  - strict_mode: boolean  # 엄격 모드 - 경고도 실패로 처리 (기본: false)
```

#### 출력 (Output)

```yaml
status: PASS | WARN | FAIL

summary:
  total_vars: number      # 전체 변수 개수
  valid_vars: number      # 유효한 변수 개수
  issues_count: number    # 문제 개수

issues:
  missing: []             # 누락된 변수 목록
  placeholder: []         # 플레이스홀더 변수 목록
  empty: []               # 빈 값 변수 목록
  invalid_format: []      # 형식 오류 변수 목록

recommendations: []       # 권장 조치 사항
```

---

## 검증 규칙 상세

### 1. 파일 존재 검증

| 검사 항목 | 결과 |
|----------|------|
| .env 파일 없음 | FAIL |
| .env.example 없음 | WARN (비교 생략) |
| 둘 다 존재 | 다음 단계 진행 |

### 2. 누락 변수 검증

`.env.example`에 정의되어 있으나 `.env`에 없는 변수를 감지합니다.

```
예시:
.env.example: SUPABASE_URL, SUPABASE_KEY, API_SECRET
.env:         SUPABASE_URL, SUPABASE_KEY

결과: missing = [API_SECRET]
```

### 3. 플레이스홀더 패턴 검증

다음 패턴이 값에 포함된 경우 경고:

| 패턴 | 예시 |
|------|------|
| `your-*`, `your_*` | `your-api-key`, `your_secret` |
| `example-*`, `example_*` | `example-token` |
| `changeme` | `changeme` |
| `placeholder` | `placeholder` |
| `xxx`, `yyy`, `zzz` | `xxx` (단독 또는 반복) |
| `TODO`, `FIXME` | `TODO: add key here` |
| `<...>`, `[...]` | `<your-key>`, `[INSERT_HERE]` |

**정규식 패턴:**
```regex
^(your[-_]|example[-_]).*$
^(changeme|placeholder|xxx+|yyy+|zzz+)$
.*(TODO|FIXME).*
^<.*>$|^\[.*\]$
```

### 4. URL 형식 검증

URL 관련 변수에 대한 형식 검증:

| 변수 패턴 | 검증 규칙 |
|----------|----------|
| `*_URL`, `*_ENDPOINT` | 유효한 URL 형식 (http/https) |
| `NEXT_PUBLIC_*_URL` | 유효한 URL 형식 |

**유효 URL 조건:**
- `http://` 또는 `https://`로 시작
- 유효한 도메인 또는 localhost
- 포트 번호 허용 (선택적)

### 5. 빈 값 검증

```
FAIL 조건:
- 값이 없는 경우: KEY=
- 공백만 있는 경우: KEY=
- 따옴표만 있는 경우: KEY=""
```

---

## 출력 형식

### 성공 시 (PASS)

```
======================================
 Environment Validation: PASS
======================================

[OK] .env.local 파일 존재
[OK] 모든 필수 변수 설정됨 (12/12)
[OK] 플레이스홀더 패턴 없음
[OK] URL 형식 유효

Status: PASS - 환경 설정이 올바릅니다.
```

### 경고 시 (WARN)

```
======================================
 Environment Validation: WARN
======================================

[OK] .env.local 파일 존재
[OK] 모든 필수 변수 설정됨 (12/12)
[WARN] .env.example 파일 없음 - 비교 생략

Status: WARN - 진행 가능하나 권장 사항을 확인하세요.

Recommendations:
  1. .env.example 파일을 생성하여 팀 공유를 용이하게 하세요.
```

### 실패 시 (FAIL)

```
======================================
 Environment Validation: FAIL
======================================

[FAIL] 환경 변수 검증 실패

Missing Variables (3):
  - SUPABASE_SERVICE_ROLE_KEY
  - PORTONE_WEBHOOK_SECRET
  - SOLAPI_API_SECRET

Placeholder Values (2):
  - NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
  - KAKAO_CLIENT_ID = "your-client-id"

Empty Values (1):
  - SOLAPI_SENDER_NUMBER = ""

Invalid Format (1):
  - NEXT_PUBLIC_APP_URL = "localhost:3000" (missing protocol)

--------------------------------------
Status: FAIL - 4개 카테고리에서 7개 문제 발견

Recommendations:
  1. 누락된 변수를 .env.local에 추가하세요.
  2. 플레이스홀더 값을 실제 값으로 교체하세요.
  3. URL 변수에 http:// 또는 https:// 프로토콜을 추가하세요.
  4. 빈 값 변수에 적절한 값을 설정하세요.
```

---

## 사용 시점

| 시점 | 트리거 | 실패 시 동작 |
|------|--------|-------------|
| 프로젝트 분석 시작 | maestro 초기화 | 경고 후 계속 |
| 배포 전 검증 | 배포 스크립트 | 배포 중단 |
| 개발 서버 시작 전 | npm run dev 전 | 경고 표시 |
| CI/CD 파이프라인 | PR/Push 시 | 빌드 실패 |

---

## 호환 에이전트

| 에이전트 | 사용 목적 |
|----------|----------|
| maestro | 프로젝트 작업 시작 전 환경 검증 |
| code-navigator | 코드 분석 전 환경 상태 확인 |
| deployer | 배포 전 필수 검증 |

---

## 의존성

```yaml
dependencies: []  # 독립 스킬 - 외부 의존성 없음

file_access:
  - Read: 필수 (.env, .env.example 읽기)
```

---

## 구현 파일 구조

```
validation/environment-validator/
BLUEPRINT.md          # 본 문서
instruction.md        # 스킬 실행 지침
patterns.json         # 플레이스홀더 패턴 정의
examples/
    pass-case.md      # 성공 케이스 예시
    warn-case.md      # 경고 케이스 예시
    fail-case.md      # 실패 케이스 예시
```

---

## 품질 체크리스트

- [x] 목적이 명확하고 단일한가? - 환경 변수 검증만 담당
- [x] 기존 자산과 중복되지 않는가? - 신규 스킬
- [x] 입출력이 명확하게 정의되었는가? - YAML 스펙 정의됨
- [x] 최소 권한 원칙을 따르는가? - Read 권한만 필요
- [x] 다른 에이전트와의 관계가 정의되었는가? - 호환 에이전트 명시

---

## 다음 단계

1. `@skill-weaver` - 본 청사진 기반으로 실제 스킬 파일 생성
   - `instruction.md` 작성
   - `patterns.json` 작성
   - 예시 파일 작성

2. `@auditor` - 생성된 스킬 품질/보안 검증

3. 레지스트리 등록 - `registry/skills.json`에 추가

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-29 | 초기 청사진 설계 |
