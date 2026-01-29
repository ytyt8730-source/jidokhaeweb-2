# Blueprint: deployment-readiness

## 요약

| 항목 | 값 |
|------|-----|
| 유형 | 스킬 (Skill) |
| 목적 | 빌드 성공 후 실제 배포/런타임 준비 상태를 검증하여 배포 실패 방지 |
| 카테고리 | validation |
| 복잡도 | 중간 |
| 버전 | 1.0.0 |

---

## 1. 요구사항 분석

### 목적
"빌드 성공 != 런타임 성공" 문제를 사전에 감지하여 배포 실패를 방지한다.

### 입력
```yaml
required:
  - project_root: 프로젝트 루트 경로 (절대 경로)
  - framework: 프레임워크 유형 (nextjs | react | vite | node)

optional:
  - validation_level: 검증 레벨 (basic | standard | full), 기본값: standard
  - timeout: 서버 시작 타임아웃 (초), 기본값: 10
  - custom_checks: 추가 검증 항목 배열
```

### 출력
```yaml
readiness_status: READY | NOT_READY | PARTIAL
summary:
  passed: 통과 항목 수
  failed: 실패 항목 수
  warnings: 경고 항목 수
checklist:
  - category: 카테고리명
    item: 검증 항목
    status: passed | failed | warning | skipped
    message: 상세 메시지
    resolution: 실패 시 해결 가이드 (optional)
recommendations: 전체 권장 사항 배열
```

### 트리거
- `npm run build` 완료 후
- 배포 전 최종 검증
- CI/CD 파이프라인 게이트
- 수동 호출: "배포 준비 상태 확인해줘"

---

## 2. 재사용 검토

### 검토 결과
- 기존 스킬 레지스트리 없음 (신규 프로젝트)
- 유사 스킬 없음
- **결론: 신규 생성 필요**

---

## 3. 상세 설계

### 3.1 검증 레벨별 범위

| 검증 항목 | basic | standard | full |
|----------|:-----:|:--------:|:----:|
| 빌드 아티팩트 존재 | O | O | O |
| 빌드 에러 분석 | - | O | O |
| 환경 변수 검증 | O | O | O |
| dev 서버 시작 | - | O | O |
| 페이지 응답 확인 | - | O | O |
| 외부 서비스 연결 | - | - | O |
| 포트 가용성 | - | O | O |
| 정적 자원 검증 | - | - | O |

### 3.2 검증 모듈 구조

```
deployment-readiness/
├── BLUEPRINT.md           # 이 문서
├── README.md              # 사용 가이드
├── skill.json             # 스킬 메타데이터
├── knowledge/
│   ├── frameworks/
│   │   ├── nextjs.md      # Next.js 검증 지식
│   │   ├── react.md       # React (CRA/Vite) 검증 지식
│   │   └── node.md        # Node.js 서버 검증 지식
│   ├── checklist/
│   │   ├── build.md       # 빌드 검증 체크리스트
│   │   ├── runtime.md     # 런타임 검증 체크리스트
│   │   ├── dependency.md  # 의존성 검증 체크리스트
│   │   └── static.md      # 정적 자원 검증 체크리스트
│   └── resolutions/
│       └── common-issues.md  # 일반적인 문제 해결 가이드
└── examples/
    ├── basic-check.md     # basic 레벨 예시
    ├── standard-check.md  # standard 레벨 예시
    └── full-check.md      # full 레벨 예시
```

### 3.3 검증 항목 상세

#### A. 빌드 검증 (Build Validation)

| 항목 | 검증 방법 | 실패 기준 |
|------|----------|----------|
| 빌드 명령 성공 | exit code 확인 | exit code != 0 |
| 아티팩트 존재 | 디렉토리 존재 확인 | .next/, dist/, build/ 없음 |
| 빌드 크기 | 아티팩트 크기 측정 | 비정상적으로 작음 (< 1KB) |
| 빌드 경고 | 로그 파싱 | critical warning 존재 |

```bash
# Next.js 아티팩트 확인 예시
test -d ".next" && test -f ".next/BUILD_ID"
```

#### B. 런타임 검증 (Runtime Validation)

| 항목 | 검증 방법 | 실패 기준 |
|------|----------|----------|
| 환경 변수 | .env 파싱 + process.env 확인 | 필수 변수 누락 |
| 서버 시작 | dev/start 명령 + 타임아웃 | 10초 내 미응답 |
| 페이지 응답 | HTTP GET 요청 | status != 200 |
| 에러 로그 | stderr 모니터링 | 치명적 에러 감지 |

```bash
# 서버 시작 + 헬스체크 예시
timeout 10s npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

#### C. 의존성 검증 (Dependency Validation)

| 항목 | 검증 방법 | 실패 기준 |
|------|----------|----------|
| DB 연결 | 연결 테스트 스크립트 | connection refused |
| 외부 API | 헬스체크 엔드포인트 | timeout 또는 5xx |
| 포트 가용성 | netstat/lsof | 포트 이미 사용 중 |

```bash
# 포트 가용성 확인 (Windows)
netstat -ano | findstr :3000
# 포트 가용성 확인 (Unix)
lsof -i :3000
```

#### D. 정적 자원 검증 (Static Assets Validation)

| 항목 | 검증 방법 | 실패 기준 |
|------|----------|----------|
| public/ 필수 파일 | 파일 존재 확인 | favicon.ico 등 누락 |
| 이미지 무결성 | 파일 크기/헤더 확인 | 0바이트 또는 손상 |
| 폰트 파일 | 확장자 및 존재 확인 | 참조된 폰트 누락 |

---

## 4. 프레임워크별 설정

### Next.js
```yaml
build_dir: .next
build_command: npm run build
dev_command: npm run dev
start_command: npm run start
default_port: 3000
health_check_path: /
required_files:
  - .next/BUILD_ID
  - .next/routes-manifest.json
env_prefix: NEXT_PUBLIC_
```

### React (Vite)
```yaml
build_dir: dist
build_command: npm run build
dev_command: npm run dev
default_port: 5173
health_check_path: /
required_files:
  - dist/index.html
  - dist/assets/
env_prefix: VITE_
```

### React (CRA)
```yaml
build_dir: build
build_command: npm run build
dev_command: npm start
default_port: 3000
health_check_path: /
required_files:
  - build/index.html
  - build/static/
env_prefix: REACT_APP_
```

### Node.js Server
```yaml
build_dir: dist (optional)
build_command: npm run build (optional)
start_command: npm start
default_port: 3000
health_check_path: /health
required_files:
  - package.json
  - entry point (main field)
```

---

## 5. 출력 형식

### 성공 시 출력 예시
```
============================================
  DEPLOYMENT READINESS CHECK
============================================

Project: C:\jidokhae-web2
Framework: Next.js
Level: standard

--------------------------------------------
  BUILD VALIDATION
--------------------------------------------
[PASSED] Build artifacts exist (.next/)
[PASSED] BUILD_ID present
[PASSED] No critical build warnings

--------------------------------------------
  RUNTIME VALIDATION
--------------------------------------------
[PASSED] Required env vars loaded (5/5)
[PASSED] Dev server started (3.2s)
[PASSED] Health check: 200 OK

--------------------------------------------
  DEPENDENCY VALIDATION
--------------------------------------------
[PASSED] Port 3000 available
[SKIPPED] External services (standard level)

============================================
  RESULT: READY
============================================
  Passed: 7  |  Failed: 0  |  Warnings: 0
============================================
```

### 실패 시 출력 예시
```
============================================
  DEPLOYMENT READINESS CHECK
============================================

Project: C:\jidokhae-web2
Framework: Next.js
Level: standard

--------------------------------------------
  BUILD VALIDATION
--------------------------------------------
[PASSED] Build artifacts exist (.next/)
[PASSED] BUILD_ID present
[WARNING] 3 deprecation warnings in build log

--------------------------------------------
  RUNTIME VALIDATION
--------------------------------------------
[FAILED] Required env vars missing
         Missing: DATABASE_URL, NEXTAUTH_SECRET
[FAILED] Dev server failed to start
         Error: Cannot find module 'prisma'

--------------------------------------------
  RESOLUTION GUIDE
--------------------------------------------

1. Missing Environment Variables
   - Copy .env.example to .env.local
   - Fill in required values:
     DATABASE_URL=postgresql://...
     NEXTAUTH_SECRET=your-secret-key

2. Missing Dependency: prisma
   - Run: npm install prisma @prisma/client
   - Run: npx prisma generate

============================================
  RESULT: NOT_READY
============================================
  Passed: 2  |  Failed: 2  |  Warnings: 1
============================================
```

---

## 6. 사용 에이전트

| 에이전트 | 용도 |
|---------|------|
| @validator | 빌드/배포 검증 워크플로우 |
| @ci-agent | CI/CD 파이프라인 통합 |
| @troubleshooter | 실패 시 자동 해결 시도 |

---

## 7. 의존 스킬

| 스킬 | 용도 | 필수 여부 |
|------|------|:--------:|
| env-validator | 환경 변수 검증 | 권장 |
| port-checker | 포트 가용성 확인 | 권장 |
| health-check | HTTP 헬스체크 | 권장 |

---

## 8. 제약 조건

1. **타임아웃 준수**: 서버 시작 검증은 최대 10초 (설정 가능)
2. **비파괴적**: 검증 과정에서 기존 파일 수정 금지
3. **포트 정리**: 검증 후 시작한 프로세스 반드시 종료
4. **Windows/Unix 호환**: 크로스 플랫폼 명령어 사용
5. **네트워크 격리**: full 레벨 외에는 외부 네트워크 접근 최소화

---

## 9. 품질 체크리스트

- [x] 목적이 명확하고 단일한가? (배포 준비 상태 검증)
- [x] 기존 자산과 중복되지 않는가? (신규 스킬)
- [x] 입출력이 명확하게 정의되었는가? (YAML 스키마 제공)
- [x] 다른 에이전트와의 관계가 정의되었는가? (validator, ci-agent)
- [x] 프레임워크별 설정이 구체적인가? (Next.js, React, Node.js)

---

## 10. 다음 단계

```
1. [선택] @strategist - 리소스/우선순위 검토
2. [필수] @skill-weaver - 스킬 구현
   - knowledge/ 디렉토리 생성
   - skill.json 메타데이터 작성
   - examples/ 작성
3. [필수] @auditor - 품질/보안 검증
4. [선택] 레지스트리 등록 (registry/skills.json)
```

---

## 부록: skill.json 템플릿

```json
{
  "name": "deployment-readiness",
  "version": "1.0.0",
  "category": "validation",
  "description": "빌드 성공 후 실제 배포/런타임 준비 상태를 검증",
  "author": "architect",
  "created": "2025-01-29",
  "keywords": ["deployment", "validation", "build", "runtime", "ci-cd"],
  "inputs": {
    "required": ["project_root", "framework"],
    "optional": ["validation_level", "timeout", "custom_checks"]
  },
  "outputs": ["readiness_status", "checklist", "recommendations"],
  "compatible_agents": ["validator", "ci-agent", "troubleshooter"],
  "dependencies": ["env-validator", "port-checker", "health-check"],
  "platforms": ["win32", "linux", "darwin"]
}
```
