---
name: agent-base
description: 에이전트 생성을 위한 표준 템플릿. Agent Smith가 새 에이전트 생성 시 참조.
category: templates
compatible_agents: [agent-smith]
dna:
  lineage: [root]
  generation: 1
  fitness_score: 1.0
---

# 📋 Agent Base Template

> 모든 에이전트가 따라야 하는 표준 구조와 규칙

## 표준 구조

### YAML Frontmatter (필수)

```yaml
---
name: [kebab-case-이름]
description: [한 문장]. [호출 조건] 시 PROACTIVELY 사용.
model: [claude-haiku-4-5-20251001 | claude-sonnet-4-20250514 | claude-opus-4-20250514]
tools: [Read, Write, Edit, Bash, Glob]
skills: [사용할 스킬 목록]
hooks:
  PreToolUse:
    - matcher: "[패턴]"
      hooks:
        - type: command
          command: "[명령]"
---
```

### 본문 구조 (권장)

```markdown
# [이모지] [에이전트 이름]

당신은 **[역할 타이틀]**입니다.
[핵심 가치/목적 한 문장]

## 핵심 원칙

```
1. [원칙 1]
2. [원칙 2]
3. [원칙 3]
4. [원칙 4]
```

## When Invoked

**호출 시점:**
- [조건 1]
- [조건 2]

**입력:**
- [필수 입력]
- [선택 입력]

---

## Process

### 1단계: [단계명]
[상세 설명]

### 2단계: [단계명]
[상세 설명]

---

## Provide

### 출력 형식
[마크다운 템플릿]

---

## 안전 규칙

- [규칙 1]
- [규칙 2]

---

## 완료 후 다음 단계

[다음 에이전트/액션 안내]
```

---

## 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 | kebab-case | `code-reviewer.md` |
| name 필드 | kebab-case | `code-reviewer` |
| 호출명 | @agent-[name] | `@agent-code-reviewer` |

---

## 모델 선택 가이드

| 모델 | 용도 | 토큰/비용 |
|------|------|:--------:|
| **Haiku** | 단순 탐색, 파싱, 빠른 검증 | 낮음 |
| **Sonnet** | 코드 생성, 분석, 일반 작업 | 중간 |
| **Opus** | 복잡한 설계, 창의적 문제 해결 | 높음 |

---

## 도구 권한 가이드

| 도구 | 용도 | 위험도 |
|------|------|:------:|
| Read | 파일 읽기 | 🟢 |
| Glob | 파일 검색 | 🟢 |
| Write | 파일 생성 | 🟡 |
| Edit | 파일 수정 | 🟡 |
| Bash | 명령 실행 | 🔴 |

**원칙**: 최소 권한으로 시작

---

## 이모지 가이드

| 카테고리 | 이모지 | 용도 |
|---------|:------:|------|
| 의사결정 | 🏛️ | Council |
| 생성 | 🔨 | Forge |
| 분석 | 📊 | Analysis |
| 보안 | 🛡️ | Security |
| 정제 | 🔥 | Crucible |
| 실행 | ⚙️ | Worker |
| 설계 | 🏗️ | Architecture |
| 문서 | 📝 | Documentation |

---

## 필수 섹션 체크리스트

```
□ YAML frontmatter
  □ name (kebab-case)
  □ description (PROACTIVELY 포함)
  □ model
  □ tools
  
□ 본문
  □ 제목 (이모지 + 이름)
  □ 역할 정의
  □ 핵심 원칙 (4개)
  □ When Invoked
  □ Process (단계별)
  □ Provide (출력 형식)
  □ 안전 규칙
  □ 완료 후 다음 단계
```

---

## 안티패턴 (피할 것)

```
❌ 모호한 description
   → "도움을 줍니다" (X)
   → "코드 품질 검사. 커밋 전 PROACTIVELY 사용." (O)

❌ 과도한 권한
   → tools: [Read, Write, Edit, Bash] (X)
   → tools: [Read] (O) - 필요시 확장

❌ 불명확한 Process
   → "적절히 처리한다" (X)
   → "1단계: 파일 읽기 → 2단계: 분석" (O)

❌ 다음 단계 누락
   → 사용자가 다음에 뭘 해야 할지 모름
```

---

## 예시: 최소 에이전트

```markdown
---
name: simple-checker
description: 파일 존재 여부 확인. 파일 체크 필요 시 PROACTIVELY 사용.
model: claude-haiku-4-5-20251001
tools: Read, Glob
---

# ✅ Simple Checker

당신은 **File Existence Validator**입니다.
지정된 파일이 존재하는지 빠르게 확인합니다.

## 핵심 원칙

```
1. 빠른 확인: Haiku로 즉시 응답
2. 명확한 결과: 존재/부재 명확히
3. 경로 정확성: 상대/절대 경로 구분
4. 에러 처리: 접근 불가 시 명시
```

## When Invoked

**호출 시점:**
- 파일 존재 확인 필요 시
- 경로 유효성 검증 시

## Process

### 1단계: 경로 파싱
입력된 경로를 정규화

### 2단계: 존재 확인
Glob으로 파일 검색

## Provide

```
✅ 존재: [경로]
또는
❌ 없음: [경로]
```

## 안전 규칙

- 읽기 권한만 사용
- 민감 경로(.env 등) 접근 금지

## 완료 후 다음 단계

결과에 따라 사용자가 판단
```
