---
name: skill-base
description: 스킬 생성을 위한 표준 템플릿. Skill Weaver가 새 스킬 생성 시 참조.
category: templates
compatible_agents: [skill-weaver]
dna:
  lineage: [root]
  generation: 1
  fitness_score: 1.0
---

# 📋 Skill Base Template

> 모든 스킬이 따라야 하는 표준 구조와 규칙

## 표준 구조

### YAML Frontmatter (필수)

```yaml
---
name: [kebab-case-이름]
description: [한 문장 설명]
category: [core | templates | validation]
compatible_agents: [호환 에이전트 목록]
dependencies: [의존 스킬]
dna:
  lineage: [부모 스킬 → 현재 스킬]
  generation: [세대 수]
  mutations:
    - "[변경 사항]"
  fitness_score: [0.0-1.0]
---
```

### 본문 구조 (권장)

```markdown
# [이모지] [스킬 이름]

> [한 줄 요약]

## 목적

[왜 이 스킬이 필요한지]

## 지식 구조

### 1. [주제 1]

[구조화된 지식]

### 2. [주제 2]

[구조화된 지식]

---

## 사용 예시

### 예시 1: [상황]

**입력:**
[입력 예시]

**적용:**
[적용 방법]

**출력:**
[기대 출력]

---

## 제약 조건

- [제약 1]
- [제약 2]

---

## 관련 스킬

- [관련 스킬 1]: [관계 설명]
```

---

## 카테고리 분류

| 카테고리 | 용도 | 예시 |
|---------|------|------|
| **core** | 기초 지식, 다른 스킬 기반 | requirement-extraction |
| **templates** | 생성 템플릿 | agent-base, skill-base |
| **validation** | 검증 규칙 | security-rules |

---

## Skill DNA 가이드

### 계보 (Lineage)

```yaml
lineage: [root]                    # 최초 스킬
lineage: [base → enhanced]         # 1세대 파생
lineage: [base → enhanced → v2]    # 2세대 파생
```

### 세대 (Generation)

| 세대 | 의미 | 권장 |
|:----:|------|:----:|
| 1 | 원본 스킬 | ✅ |
| 2 | 1차 파생 | ✅ |
| 3 | 2차 파생 | ⚠️ |
| 4+ | 과도한 파생 | ❌ |

**3세대 초과 시 재설계 권장**

### 변이 (Mutations)

```yaml
mutations:
  - "OWASP 2024 반영"      # 지식 업데이트
  - "예시 3개 추가"        # 내용 보강
  - "토큰 최적화 (-30%)"   # 효율 개선
```

### 적합도 (Fitness Score)

| 점수 | 의미 | 액션 |
|:----:|------|------|
| 0.9+ | 우수 | Core 승격 고려 |
| 0.7-0.9 | 양호 | 유지 |
| 0.5-0.7 | 보통 | 개선 검토 |
| <0.5 | 미흡 | 리팩토링 필요 |

---

## 토큰 최적화 가이드

### 점진적 공개 설계

```
초기 로드 (Claude가 처음 보는 것):
├── name: ~10 토큰
└── description: ~30 토큰
→ 총 ~40 토큰

실제 호출 시:
└── 전체 본문: ~500-1000 토큰
```

### 최적화 기법

| 기법 | Before | After | 절약 |
|------|:------:|:-----:|:----:|
| 표 활용 | 텍스트 설명 | 표 정리 | -30% |
| 중복 제거 | 반복 설명 | 참조 | -20% |
| 예시 최소화 | 5개 | 2개 | -40% |

---

## 스킬 크기 가이드라인

| 기준 | 권장 | 초과 시 |
|------|:----:|--------|
| 전체 줄 수 | <150줄 | 분할 검토 |
| 주제 수 | 2-4개 | 분할 검토 |
| 예시 수 | 2-3개 | 핵심만 유지 |
| 토큰 | <1000 | 압축 검토 |

---

## 필수 섹션 체크리스트

```
□ YAML frontmatter
  □ name (kebab-case)
  □ description
  □ category
  □ compatible_agents
  □ dna
    □ lineage
    □ generation
    □ fitness_score

□ 본문
  □ 제목 (이모지 + 이름)
  □ 한 줄 요약
  □ 목적
  □ 지식 구조 (최소 1개 주제)
  □ 사용 예시 (최소 2개)
  □ 제약 조건
```

---

## 안티패턴 (피할 것)

```
❌ 과도한 범위
   → 하나의 스킬에 5개 이상 주제 (X)
   → 분할하여 2-3개 스킬로 (O)

❌ 예시 없음
   → 추상적 설명만 (X)
   → 구체적 예시 포함 (O)

❌ DNA 누락
   → 계보 추적 불가 (X)
   → 항상 DNA 포함 (O)

❌ 의존성 미명시
   → dependencies 누락 (X)
   → 참조하는 스킬 명시 (O)
```

---

## 예시: 최소 스킬

```markdown
---
name: simple-validation
description: 입력값 기본 검증 규칙
category: validation
compatible_agents: [auditor]
dna:
  lineage: [root]
  generation: 1
  fitness_score: 0.5
---

# ✅ Simple Validation

> 입력값의 기본적인 유효성 검증 규칙

## 목적

사용자 입력이 기본 요구사항을 충족하는지 확인

## 지식 구조

### 1. 필수값 검증

| 검사 | 조건 | 에러 |
|------|------|------|
| null 체크 | value != null | "필수 입력" |
| 빈 문자열 | value.length > 0 | "빈 값 불가" |

---

## 사용 예시

### 예시 1: 이메일 검증

**입력:** `""`
**적용:** 빈 문자열 검사
**출력:** ❌ "빈 값 불가"

### 예시 2: 정상 입력

**입력:** `"user@example.com"`
**적용:** 모든 검사 통과
**출력:** ✅ 유효

---

## 제약 조건

- 형식 검증은 별도 스킬에서 처리
- 비즈니스 규칙 검증 미포함
```
