---
name: security-rules
description: 에이전트/스킬의 보안 검증 규칙. Auditor가 검증 시 참조.
category: validation
compatible_agents: [auditor, agent-smith, skill-weaver]
dna:
  lineage: [root]
  generation: 1
  fitness_score: 1.0
---

# 🛡️ Security Rules

> 모든 에이전트와 스킬이 준수해야 하는 보안 규칙

## 목적

에이전트/스킬 생성 및 실행 시 보안 위험 방지

---

## 1. 절대 금지 (No Exception)

### 파일 접근 금지 목록

| 패턴 | 위험 | 사유 |
|------|:----:|------|
| `.env` | 🔴 | API 키, 비밀번호 노출 |
| `.env.local` | 🔴 | 로컬 환경 변수 |
| `.env.*` | 🔴 | 모든 환경 파일 |
| `**/secrets/**` | 🔴 | 비밀 저장소 |
| `**/*.pem` | 🔴 | 인증서/키 |
| `**/*.key` | 🔴 | 개인 키 |
| `**/id_rsa*` | 🔴 | SSH 키 |

### 금지 명령어

| 명령 | 위험 | 사유 |
|------|:----:|------|
| `rm -rf /` | 🔴 | 시스템 파괴 |
| `rm -rf ~` | 🔴 | 홈 디렉토리 삭제 |
| `chmod 777` | 🔴 | 권한 완전 개방 |
| `curl \| bash` | 🔴 | 원격 코드 실행 |
| `eval` | 🔴 | 동적 코드 실행 |

### 금지 패턴 (코드 내)

```
❌ 하드코딩된 비밀
   password = "mypassword123"
   api_key = "sk-..."

❌ 환경 변수 직접 출력
   console.log(process.env)
   print(os.environ)
```

---

## 2. 위험 권한 조합

### 권한 매트릭스

```
        Read  Write  Edit  Bash  Glob
Read     ✅    ✅    ✅    ⚠️    ✅
Write    ✅    ✅    ✅    🔴    ✅
Edit     ✅    ✅    ✅    🔴    ✅
Bash     ⚠️    🔴    🔴    ✅    ⚠️
Glob     ✅    ✅    ✅    ⚠️    ✅
```

### 위험 조합 상세

| 조합 | 위험도 | 사유 | 허용 조건 |
|------|:------:|------|----------|
| Write + Bash | 🔴 | 파일 생성 후 실행 | 명시적 사유 필수 |
| Edit + Bash | 🔴 | 코드 수정 후 실행 | 명시적 사유 필수 |
| Read + Bash | ⚠️ | 정보 수집 후 명령 | 범위 제한 필요 |

---

## 3. 접근 제어 규칙

### 파일 시스템 범위

```yaml
allowed:
  - "./src/**"           # 소스 코드
  - "./docs/**"          # 문서
  - "./.claude/**"       # 에이전트/스킬
  - "./registry/**"      # 레지스트리

restricted:
  - "./node_modules/**"  # 읽기만 허용
  - "./.git/**"          # 읽기만 허용

forbidden:
  - "../**"              # 상위 디렉토리
  - "/**"                # 루트 접근
  - "~/**"               # 홈 디렉토리
```

### 네트워크 제한

```yaml
allowed:
  - localhost
  - 127.0.0.1

restricted:
  - 외부 API (명시적 승인 필요)

forbidden:
  - 알 수 없는 외부 URL
  - IP 직접 접근
```

---

## 4. 입력 검증

### 필수 검증 항목

| 입력 유형 | 검증 | 예시 |
|----------|------|------|
| 파일 경로 | 경로 순회 방지 | `../` 포함 시 거부 |
| 명령어 | 위험 명령 필터 | `rm`, `chmod` 검사 |
| URL | 프로토콜 검증 | `http://`, `https://`만 |
| 사용자 입력 | 특수문자 이스케이프 | `; && \|` 필터 |

### 경로 순회 공격 방지

```
❌ 위험한 입력
   path: "../../etc/passwd"
   path: "/etc/shadow"

✅ 안전한 처리
   1. 상대 경로를 절대 경로로 변환
   2. 허용된 디렉토리 내인지 확인
   3. 심볼릭 링크 해석 후 재확인
```

---

## 5. 출력 검증

### 민감 정보 필터링

```yaml
filter_patterns:
  - "password"
  - "secret"
  - "api_key"
  - "token"
  - "credential"
  - 정규식: "[a-zA-Z0-9]{32,}"  # 긴 해시/키
```

### 출력 금지 항목

| 항목 | 대체 |
|------|------|
| 전체 API 키 | `sk-...xxxx` (마스킹) |
| 비밀번호 | `*****` |
| 개인정보 | `[REDACTED]` |

---

## 6. 실행 환경 보안

### Bash 실행 제한

```yaml
bash_restrictions:
  timeout: 30s              # 최대 실행 시간
  max_output: 10KB          # 출력 제한
  no_background: true       # & 사용 금지
  no_redirect: true         # > 리다이렉션 제한
```

### 파일 작업 제한

```yaml
file_restrictions:
  max_file_size: 1MB        # 단일 파일 크기
  max_files_per_op: 10      # 한 번에 처리 파일 수
  no_binary: true           # 바이너리 파일 금지
```

---

## 사용 예시

### 예시 1: 권한 검증

**입력:** `tools: [Read, Write, Bash]`

**검증:**
```
Write + Bash 조합 감지 → 🔴 위험
```

**결과:** ❌ 명시적 사유 요구

### 예시 2: 경로 검증

**입력:** `path: "../../../etc/passwd"`

**검증:**
```
경로 순회 패턴 감지 → 🔴 차단
```

**결과:** ❌ 거부

---

## 제약 조건

- 이 규칙은 **항상** 적용됨 (예외 없음)
- 규칙 우회 시도 시 **즉시 보고**
- 새로운 위협 발견 시 **즉시 업데이트**
