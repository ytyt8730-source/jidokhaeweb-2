---
name: requirement-extraction
description: 사용자 요청에서 핵심 요구사항을 추출하여 구조화된 청사진으로 변환합니다.
version: 1.0.0
author: The Forge
tags: [core, analysis, architect]
---

# 요구사항 추출 스킬 (Requirement Extraction)

## 목적

사용자의 자연어 요청을 분석하여 **구조화된 청사진(Blueprint)**으로 변환합니다.
이 청사진은 이후 에이전트/스킬 생성의 기반이 됩니다.

---

## 입력 → 출력

```
입력: "API 테스트 자동화 에이전트 만들어줘"

출력: {
  "request_type": "agent_creation",
  "domain": "testing",
  "core_function": "API 엔드포인트 자동 테스트",
  "sub_functions": [
    "엔드포인트 호출",
    "응답 검증",
    "인증 처리"
  ],
  "suggested_skills": [
    "endpoint-validator",
    "response-checker",
    "auth-handler"
  ],
  "complexity": "medium",
  "estimated_tokens": 15000
}
```

---

## 추출 프로세스

### 1단계: 요청 유형 분류

| 유형 | 키워드 | 예시 |
|------|--------|------|
| `agent_creation` | "에이전트 만들어", "생성해" | "코드 리뷰 에이전트 만들어줘" |
| `skill_creation` | "스킬 만들어", "기능 추가" | "SQL 검증 스킬 만들어줘" |
| `modification` | "수정해", "개선해" | "기존 테스트 에이전트 개선해줘" |
| `query` | "어떻게", "뭐가" | "어떤 에이전트가 있어?" |

### 2단계: 도메인 식별

| 도메인 | 관련 키워드 |
|--------|------------|
| `testing` | 테스트, 검증, QA, 시나리오 |
| `coding` | 코드, 구현, 개발, 리팩토링 |
| `documentation` | 문서, 정리, 기록, 로그 |
| `security` | 보안, 취약점, 권한, 인증 |
| `data` | 데이터, 분석, 파싱, 변환 |
| `infra` | 배포, 서버, CI/CD, 환경 |

### 3단계: 기능 분해

핵심 기능(core_function)을 하위 기능(sub_functions)으로 분해:

```
"API 테스트 자동화"
    ├── 엔드포인트 호출 (HTTP 요청)
    ├── 응답 검증 (상태코드, 스키마)
    ├── 인증 처리 (토큰, 세션)
    └── 결과 리포팅 (성공/실패)
```

### 4단계: 복잡도 산정

| 복잡도 | 기준 | 예상 토큰 |
|--------|------|----------|
| `simple` | 기능 1~2개, 단일 도메인 | ~5,000 |
| `medium` | 기능 3~5개, 단일 도메인 | ~15,000 |
| `complex` | 기능 5개+, 다중 도메인 | ~30,000+ |

---

## 출력 스키마

```json
{
  "request_type": "agent_creation | skill_creation | modification | query",
  "domain": "testing | coding | documentation | security | data | infra",
  "core_function": "핵심 기능 한 문장",
  "sub_functions": ["하위 기능 1", "하위 기능 2"],
  "suggested_skills": ["필요한 스킬 1", "필요한 스킬 2"],
  "dependencies": ["의존하는 기존 에이전트/스킬"],
  "complexity": "simple | medium | complex",
  "estimated_tokens": 15000,
  "notes": "특이사항이나 주의점"
}
```

---

## 사용 예시

### 예시 1: 단순 요청

```
입력: "코드 포매팅 스킬 만들어줘"

출력: {
  "request_type": "skill_creation",
  "domain": "coding",
  "core_function": "코드 스타일 자동 포매팅",
  "sub_functions": ["Prettier 실행", "ESLint 수정"],
  "suggested_skills": [],
  "dependencies": [],
  "complexity": "simple",
  "estimated_tokens": 3000
}
```

### 예시 2: 복잡한 요청

```
입력: "레거시 PHP를 Python FastAPI로 마이그레이션하는 에이전트 만들어줘"

출력: {
  "request_type": "agent_creation",
  "domain": "coding",
  "core_function": "PHP → Python FastAPI 코드 변환",
  "sub_functions": [
    "PHP 코드 구조 분석",
    "엔드포인트 매핑",
    "ORM 변환 (SQL → SQLAlchemy)",
    "세션 처리 변환",
    "동작 일치성 검증"
  ],
  "suggested_skills": [
    "php-pattern-detector",
    "fastapi-best-practices",
    "sql-to-sqlalchemy",
    "endpoint-comparison"
  ],
  "dependencies": [],
  "complexity": "complex",
  "estimated_tokens": 50000,
  "notes": "단계별 실행 권장 (분석 → 변환 → 검증)"
}
```

---

## 주의사항

- 모호한 요청은 **질문으로 명확화** (추측 금지)
- 기존 에이전트/스킬과 **중복 여부 확인** (registry 참조)
- 복잡도가 `complex`면 **단계 분할 제안**
