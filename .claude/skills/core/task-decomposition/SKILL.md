---
name: task-decomposition
description: 복잡한 작업을 독립적으로 실행 가능한 단위로 분해합니다.
version: 1.0.0
author: The Forge
tags: [core, planning, architect]
---

# 작업 분해 스킬 (Task Decomposition)

## 목적

하나의 큰 작업을 **독립적으로 실행 가능한 작은 단위**로 분해합니다.
각 단위는 병렬 실행 가능 여부와 의존 관계가 명시됩니다.

---

## 핵심 원칙

### 1. 수직 분할 (Vertical Slicing)

```
❌ 잘못된 분할 (수평):
Task 1: DB 전체 설계
Task 2: API 전체 구현  
Task 3: UI 전체 개발

✅ 올바른 분할 (수직):
Task 1: 로그인 기능 (DB + API + UI)
Task 2: 목록 조회 (DB + API + UI)
Task 3: 상세 보기 (DB + API + UI)
```

**이유**: 각 Task 완료 시 **사용자가 실제로 사용할 수 있는 기능**이 나와야 함

### 2. 단일 책임 (Single Responsibility)

각 Task는 **하나의 목적**만 가짐:

```
❌ "사용자 인증하고 대시보드 보여주기"
✅ Task 1: "사용자 인증"
✅ Task 2: "대시보드 표시"
```

### 3. 적절한 크기

| 기준 | 권장 |
|------|------|
| Task당 예상 시간 | 1~4시간 |
| Task당 예상 토큰 | 5,000~20,000 |
| 전체 Task 수 | 3~10개 |

---

## 분해 프로세스

### 1단계: 최종 목표 정의

```
"무엇이 완료되면 성공인가?"
→ "사용자가 API 테스트를 자동으로 실행하고 결과를 확인할 수 있다"
```

### 2단계: 역방향 분해 (Backward Decomposition)

최종 목표에서 거꾸로 필요한 단계를 도출:

```
[최종] 결과 확인
    ↑
[4] 결과 리포팅
    ↑
[3] 응답 검증
    ↑
[2] API 호출
    ↑
[1] 테스트 케이스 로드
    ↑
[시작] 설정 파일 읽기
```

### 3단계: 의존 관계 분석

```
[1] 설정 로드 ─────────────────┐
                               │
[2] 테스트 케이스 로드 ──────────┼──▶ [5] 테스트 실행
                               │
[3] 인증 토큰 발급 ─────────────┘
                                      │
                                      ▼
                               [6] 결과 리포팅
```

### 4단계: 병렬화 가능 여부 판단

| Task | 의존 | 병렬 가능 |
|------|------|:--------:|
| 설정 로드 | 없음 | - |
| 테스트 케이스 로드 | 설정 | ✅ (인증과 병렬) |
| 인증 토큰 발급 | 설정 | ✅ (케이스 로드와 병렬) |
| 테스트 실행 | 케이스 + 인증 | ❌ |
| 결과 리포팅 | 실행 | ❌ |

---

## 출력 스키마

```json
{
  "goal": "최종 목표 한 문장",
  "total_tasks": 5,
  "estimated_total_tokens": 25000,
  "tasks": [
    {
      "id": "T1",
      "name": "설정 파일 로드",
      "description": "테스트 환경 설정 읽기",
      "depends_on": [],
      "parallel_with": [],
      "estimated_tokens": 3000,
      "assigned_model": "haiku",
      "output": "설정 객체"
    },
    {
      "id": "T2",
      "name": "테스트 케이스 로드",
      "depends_on": ["T1"],
      "parallel_with": ["T3"],
      "estimated_tokens": 5000,
      "assigned_model": "haiku",
      "output": "테스트 케이스 배열"
    }
  ],
  "execution_order": [
    ["T1"],
    ["T2", "T3"],
    ["T4"],
    ["T5"]
  ]
}
```

---

## 실행 순서 시각화

```
execution_order 해석:

Phase 1: [T1]           ← 순차 실행
Phase 2: [T2, T3]       ← 병렬 실행
Phase 3: [T4]           ← 순차 실행
Phase 4: [T5]           ← 순차 실행

시간 절약: T2와 T3을 병렬로 실행하여 전체 시간 단축
```

---

## 분해 예시

### 입력

```json
{
  "request_type": "agent_creation",
  "core_function": "API 테스트 자동화",
  "sub_functions": ["엔드포인트 호출", "응답 검증", "인증 처리", "결과 리포팅"]
}
```

### 출력

```json
{
  "goal": "API 엔드포인트를 자동으로 테스트하고 결과를 리포트한다",
  "total_tasks": 6,
  "estimated_total_tokens": 28000,
  "tasks": [
    {
      "id": "T1",
      "name": "에이전트 기본 구조 생성",
      "depends_on": [],
      "parallel_with": [],
      "estimated_tokens": 5000,
      "assigned_model": "sonnet"
    },
    {
      "id": "T2", 
      "name": "인증 처리 스킬 생성",
      "depends_on": ["T1"],
      "parallel_with": ["T3", "T4"],
      "estimated_tokens": 4000,
      "assigned_model": "sonnet"
    },
    {
      "id": "T3",
      "name": "엔드포인트 호출 스킬 생성",
      "depends_on": ["T1"],
      "parallel_with": ["T2", "T4"],
      "estimated_tokens": 5000,
      "assigned_model": "sonnet"
    },
    {
      "id": "T4",
      "name": "응답 검증 스킬 생성",
      "depends_on": ["T1"],
      "parallel_with": ["T2", "T3"],
      "estimated_tokens": 5000,
      "assigned_model": "sonnet"
    },
    {
      "id": "T5",
      "name": "결과 리포팅 스킬 생성",
      "depends_on": ["T2", "T3", "T4"],
      "parallel_with": [],
      "estimated_tokens": 4000,
      "assigned_model": "sonnet"
    },
    {
      "id": "T6",
      "name": "통합 및 검증",
      "depends_on": ["T5"],
      "parallel_with": [],
      "estimated_tokens": 5000,
      "assigned_model": "sonnet"
    }
  ],
  "execution_order": [
    ["T1"],
    ["T2", "T3", "T4"],
    ["T5"],
    ["T6"]
  ]
}
```

---

## 주의사항

- Task가 10개 초과 시 **상위 그룹으로 묶기** 제안
- 순환 의존성(A→B→A) 발견 시 **경고**
- 단일 Task가 20,000 토큰 초과 시 **추가 분해** 제안
