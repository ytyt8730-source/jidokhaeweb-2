---
name: pattern-matching
description: 새 요청을 기존 에이전트/스킬/패턴과 매칭하여 재사용 가능 여부를 판단합니다.
version: 1.0.0
author: The Forge
tags: [core, optimization, architect]
---

# 패턴 매칭 스킬 (Pattern Matching)

## 목적

새로운 요청이 들어왔을 때, **기존에 만들어둔 자산(에이전트, 스킬, 패턴)**과 비교하여:

1. 그대로 재사용 가능한가?
2. 약간 수정하면 사용 가능한가?
3. 새로 만들어야 하는가?

를 판단합니다.

---

## 왜 필요한가?

```
❌ 매번 새로 만들면:
- 토큰 낭비
- 시간 낭비
- 품질 불일치

✅ 기존 자산 재사용하면:
- 토큰 절약
- 검증된 품질
- 일관성 유지
```

---

## 매칭 프로세스

### 1단계: Registry 조회

```
registry/
├── agents.json    ← 생성된 에이전트 목록
├── skills.json    ← 생성된 스킬 목록
└── patterns.json  ← 학습된 패턴 목록
```

### 2단계: 유사도 계산

| 비교 항목 | 가중치 | 설명 |
|----------|:------:|------|
| 도메인 일치 | 30% | testing, coding 등 |
| 기능 유사성 | 40% | 핵심 기능의 유사도 |
| 입출력 형태 | 20% | 입력/출력 구조 |
| 사용 도구 | 10% | Read, Write, Bash 등 |

### 3단계: 매칭 결과 분류

| 유사도 | 판정 | 액션 |
|:------:|------|------|
| 90%+ | **완전 재사용** | 기존 것 그대로 사용 |
| 70~89% | **부분 수정** | 기존 것 복사 후 수정 |
| 50~69% | **참고 생성** | 기존 것 참고하여 새로 생성 |
| ~49% | **신규 생성** | 처음부터 새로 생성 |

---

## 출력 스키마

```json
{
  "query": "원본 요청",
  "matches": [
    {
      "type": "agent",
      "name": "api-tester",
      "path": ".claude/agents/workers/api-tester.md",
      "similarity": 85,
      "matching_points": ["도메인: testing", "기능: API 호출"],
      "differences": ["인증 방식 다름"],
      "recommendation": "partial_reuse",
      "modification_needed": "OAuth 인증 추가 필요"
    },
    {
      "type": "skill",
      "name": "response-checker",
      "path": ".claude/skills/validation/response-checker/SKILL.md",
      "similarity": 92,
      "matching_points": ["응답 검증", "스키마 체크"],
      "differences": [],
      "recommendation": "full_reuse"
    }
  ],
  "patterns_found": [
    {
      "name": "api-test-pattern",
      "description": "API 테스트 표준 흐름",
      "applicable": true
    }
  ],
  "overall_recommendation": "partial_reuse",
  "reusable_components": ["response-checker", "api-test-pattern"],
  "to_create": ["oauth-handler"]
}
```

---

## 매칭 예시

### 예시 1: 완전 재사용

```
요청: "응답 JSON 스키마 검증 스킬 만들어줘"

매칭 결과:
- 기존 skill: response-checker (유사도 95%)
- 판정: full_reuse
- 액션: "이미 response-checker 스킬이 있습니다. 바로 사용 가능합니다."
```

### 예시 2: 부분 수정

```
요청: "GraphQL API 테스트 에이전트 만들어줘"

매칭 결과:
- 기존 agent: api-tester (유사도 75%)
- 판정: partial_reuse
- 차이점: REST → GraphQL
- 액션: "기존 api-tester를 복사하여 GraphQL 쿼리 처리 부분만 수정합니다."
```

### 예시 3: 참고 생성

```
요청: "이미지 최적화 에이전트 만들어줘"

매칭 결과:
- 기존 agent: file-processor (유사도 55%)
- 판정: reference_create
- 참고점: 파일 처리 흐름
- 액션: "file-processor의 구조를 참고하여 이미지 처리 로직으로 새로 생성합니다."
```

### 예시 4: 신규 생성

```
요청: "블록체인 트랜잭션 모니터링 에이전트 만들어줘"

매칭 결과:
- 유사한 기존 자산: 없음 (최고 유사도 30%)
- 판정: new_create
- 액션: "기존 자산 중 참고할 것이 없습니다. 새로 생성합니다."
```

---

## Registry 구조 참고

### agents.json 예시

```json
{
  "agents": [
    {
      "name": "api-tester",
      "domain": "testing",
      "functions": ["API 호출", "응답 검증"],
      "tools": ["Read", "Bash"],
      "model": "sonnet",
      "created": "2024-01-15",
      "usage_count": 12,
      "success_rate": 0.92
    }
  ]
}
```

### patterns.json 예시

```json
{
  "patterns": [
    {
      "name": "api-test-pattern",
      "description": "API 테스트 표준 흐름",
      "steps": ["설정 로드", "인증", "호출", "검증", "리포트"],
      "applicable_domains": ["testing", "integration"],
      "success_rate": 0.88
    }
  ]
}
```

---

## 주의사항

- 유사도가 애매한 경우(60~70%) **사용자에게 선택권** 제공
- success_rate가 낮은 기존 자산(70% 미만)은 **재사용 비권장**
- 매칭 결과는 **제안일 뿐**, 최종 결정은 architect가 수행
