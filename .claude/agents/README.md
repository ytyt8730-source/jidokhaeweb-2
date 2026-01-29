# 🎼 The Maestro 시스템

## 핵심 개념

**maestro = Claude Code의 메인 오케스트레이터 (지휘자)**

```
요청 → maestro가 판단 → 적합한 전문가에게 위임 → Summary 수신 → 결과 통합
```

### 왜 이렇게 하는가?

```
컨텍스트는 한정된 자원이다.
직접 다 하면 컨텍스트가 오염된다.
전문가에게 위임하면 독립 컨텍스트에서 실행되고, Summary만 돌아온다.
maestro의 화이트보드는 깨끗하게 유지된다.
```

---

## 에이전틱 루프

```
1. 문맥 파악: "무엇이 필요한가?"
2. 행동: 전문가 디스패치 또는 직접 수행
3. 검증: 결과 확인, 필요시 재시도
```

---

## 폴더 구조

```
.claude/
├── agents/
│   ├── maestro.md            ← 메인 오케스트레이터 (지휘자)
│   │
│   ├── council/              ← 의사결정
│   │   ├── scout.md              자원 탐색 (현황 파악)
│   │   ├── architect.md          새 도구 설계
│   │   ├── strategist.md         리소스 전략
│   │   └── auditor.md            품질 검증
│   │
│   ├── forge/                ← 도구 생성
│   │   ├── agent-smith.md        에이전트 생성
│   │   └── skill-weaver.md       스킬 생성
│   │
│   ├── crucible/             ← 분석/개선
│   │   ├── analyzer.md           성능 분석
│   │   └── evolver.md            개선안 도출
│   │
│   ├── planning/             ← 프로젝트 계획
│   │   ├── 마일스톤.md           프로젝트 → Milestone
│   │   ├── 워크패키지.md         Milestone → Phase
│   │   └── 시나리오.md           Phase → 테스트 SC
│   │
│   └── workers/              ← 동적 생성 워커들
│
├── skills/                   ← 재사용 지식
│   ├── core/
│   ├── templates/
│   └── validation/
│
└── registry/                 ← 도구 목록 (재사용)
    ├── agents.json
    ├── skills.json
    └── patterns.json
```

---

## 자동 위임

```
maestro는 케이스별 규칙을 외우지 않는다.
각 전문가의 description을 읽고 적합한 전문가를 선택한다.

무엇이 있는지 모르면 → council/scout 호출
새 도구가 필요하면 → council/architect 호출
```

---

## 도구 제작 흐름

```
architect (설계) → strategist (전략) → agent-smith/skill-weaver (생성) → auditor (검증) → registry (등록)
```

---

## 병렬 처리

```
대량 반복 작업 감지 시:
1. 워커 확보 (있으면 재사용, 없으면 제작)
2. 배치로 나눠서 병렬 디스패치
3. Summary 수집
4. 결과 통합
```
