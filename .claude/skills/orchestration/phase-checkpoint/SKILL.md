---
name: phase-checkpoint
description: Phase 완료 시 WP/SC 문서 기반 완료율 판정. PASS/PARTIAL/FAIL 결과 산출.
category: orchestration
compatible_agents: [maestro, auditor]
dependencies: []
dna:
  lineage: [root]
  generation: 1
  mutations: []
  fitness_score: 0.5
---

# Phase Checkpoint

> Phase 완료 시점에 WP/SC 문서를 분석하여 완료율을 판정

## 목적

Phase 작업 완료 시 객관적 기준으로 진행 상태를 판정:
- WP(Work Package) 문서의 완료 기준 충족 여부 확인
- SC(Scenario) 문서의 시나리오 통과 여부 확인
- 다음 Phase 진행 가능 여부 결정

---

## 문서 경로 규칙

### WP (Work Package) 문서

```
roadmap/phases/phase-{N}/WP-{N}.{M}-{name}.md

예시:
roadmap/phases/phase-1/WP-1.1-supabase-setup.md
roadmap/phases/phase-2/WP-2.3-payment-integration.md
```

### SC (Scenario) 문서

```
roadmap/phases/phase-{N}/SC-{N}.{M}-{name}.md

예시:
roadmap/phases/phase-1/SC-1.1-auth-flow.md
roadmap/phases/phase-2/SC-2.2-order-process.md
```

### 문서 탐색 패턴

```
Phase N 완료 체크 시:
1. roadmap/phases/phase-{N}/ 디렉토리 탐색
2. WP-{N}.*.md 파일 목록 수집
3. SC-{N}.*.md 파일 목록 수집
4. 각 문서 파싱 및 분석
```

---

## 완료 기준 추출 패턴

### WP 문서 구조

```markdown
## 완료 기준

- [ ] 기준 1: 미완료 항목
- [x] 기준 2: 완료 항목
- [ ] 기준 3: 미완료 항목
```

### 추출 정규식

```regex
완료: \[x\] (.+)
미완료: \[ \] (.+)
```

### 완료율 계산

```
완료율 = 완료된 항목 수 / 전체 항목 수 * 100

예시:
- [x] 항목 1
- [x] 항목 2
- [ ] 항목 3
- [ ] 항목 4

완료율 = 2/4 * 100 = 50%
```

---

## 시나리오 추출 패턴

### SC 문서 구조

```markdown
## 시나리오 목록

### 시나리오 1: [이름]
- 상태: PASS | FAIL | SKIP

### 시나리오 2: [이름]
- 상태: PASS | FAIL | SKIP
```

### 추출 방법

| 상태 | 패턴 | 의미 |
|------|------|------|
| PASS | `상태: PASS` | 테스트 통과 |
| FAIL | `상태: FAIL` | 테스트 실패 |
| SKIP | `상태: SKIP` | 건너뜀 (점수 제외) |

### 시나리오 점수 계산

```
시나리오 점수 = PASS 수 / (PASS + FAIL) 수 * 100

SKIP은 분모에서 제외

예시:
- 시나리오 1: PASS
- 시나리오 2: PASS
- 시나리오 3: FAIL
- 시나리오 4: SKIP

점수 = 2/3 * 100 = 66.7%
```

---

## 판정 기준

### 최종 점수 계산

```
최종 점수 = (WP 완료율 * 0.6) + (SC 점수 * 0.4)

가중치:
- WP (완료 기준): 60%
- SC (시나리오): 40%
```

### 판정 등급

| 등급 | 점수 범위 | 의미 | 다음 단계 |
|:----:|:---------:|------|----------|
| PASS | 80% 이상 | 충분히 완료 | Phase 종료, 다음 진행 |
| PARTIAL | 50-79% | 부분 완료 | 보완 후 재판정 |
| FAIL | 50% 미만 | 미완료 | 작업 계속 필요 |

### 특수 조건

| 조건 | 결과 |
|------|------|
| WP 0개 | SKIP (Phase 없음) |
| SC 0개 | WP만으로 판정 (100% 가중치) |
| 필수 항목 FAIL | 전체 FAIL (점수 무관) |

---

## 출력 형식

### 체크포인트 리포트

```
## Phase {N} Checkpoint Report

### 판정 결과: [PASS | PARTIAL | FAIL]

### WP (Work Package) 분석

| 문서 | 완료 | 전체 | 완료율 |
|------|:----:|:----:|:------:|
| WP-N.1-xxx | 3 | 4 | 75% |
| WP-N.2-yyy | 5 | 5 | 100% |
| **합계** | **8** | **9** | **88.9%** |

### SC (Scenario) 분석

| 문서 | PASS | FAIL | SKIP | 점수 |
|------|:----:|:----:|:----:|:----:|
| SC-N.1-xxx | 3 | 1 | 0 | 75% |
| SC-N.2-yyy | 2 | 0 | 1 | 100% |
| **합계** | **5** | **1** | **1** | **83.3%** |

### 최종 점수

| 항목 | 점수 | 가중치 | 기여도 |
|------|:----:|:------:|:------:|
| WP 완료율 | 88.9% | 60% | 53.3% |
| SC 점수 | 83.3% | 40% | 33.3% |
| **최종** | - | - | **86.6%** |

### 미완료 항목

#### WP 미완료
- [ ] WP-N.1: [항목 내용]

#### SC 실패
- SC-N.1: 시나리오 3 - [실패 사유]

### 권장 사항

[다음 단계 안내]
```

---

## 사용 예시

### 예시 1: Phase 완료 체크 (maestro 호출)

**트리거:**
```
Phase 1 작업 완료 후 maestro가 체크포인트 호출
```

**실행:**
```
1. roadmap/phases/phase-1/ 디렉토리 탐색
2. WP-1.*.md 파일들 파싱
3. SC-1.*.md 파일들 파싱
4. 완료율 계산
5. 판정 결과 산출
```

**출력:**
```
## Phase 1 Checkpoint Report

### 판정 결과: PASS

### WP 분석
| 문서 | 완료 | 전체 | 완료율 |
|------|:----:|:----:|:------:|
| WP-1.1-supabase-setup | 4 | 4 | 100% |
| WP-1.2-auth-basic | 3 | 3 | 100% |
| **합계** | **7** | **7** | **100%** |

### SC 분석
| 문서 | PASS | FAIL | SKIP | 점수 |
|------|:----:|:----:|:----:|:----:|
| SC-1.1-auth-flow | 5 | 0 | 0 | 100% |
| **합계** | **5** | **0** | **0** | **100%** |

### 최종 점수: 100%

### 권장 사항
Phase 1 완료. Phase 2 진행 가능.
```

### 예시 2: 부분 완료 (PARTIAL)

**상황:**
```
WP 완료율: 70%
SC 점수: 60%
```

**출력:**
```
## Phase 2 Checkpoint Report

### 판정 결과: PARTIAL

### 최종 점수
| 항목 | 점수 | 가중치 | 기여도 |
|------|:----:|:------:|:------:|
| WP 완료율 | 70% | 60% | 42% |
| SC 점수 | 60% | 40% | 24% |
| **최종** | - | - | **66%** |

### 미완료 항목

#### WP 미완료
- [ ] WP-2.1: 결제 웹훅 핸들러 구현
- [ ] WP-2.2: 에러 처리 로직 추가

#### SC 실패
- SC-2.1: 시나리오 3 - 결제 취소 flow 미구현

### 권장 사항
미완료 항목 보완 후 재판정 필요.
예상 추가 작업: 2-3시간
```

### 예시 3: FAIL 판정

**상황:**
```
WP 완료율: 30%
SC 점수: 40%
```

**출력:**
```
## Phase 3 Checkpoint Report

### 판정 결과: FAIL

### 최종 점수: 34%

### 미완료 항목
[다수 항목...]

### 권장 사항
Phase 3 작업 계속 필요.
완료율이 낮아 다음 Phase 진행 불가.
```

---

## 검증 실행 방법

### maestro가 호출하는 방법

```
작업 완료 시:
1. "Phase {N} 체크포인트 실행"
2. phase-checkpoint 스킬 적용
3. 결과에 따라 다음 결정:
   - PASS: Phase 종료, 다음 Phase 시작
   - PARTIAL: 보완 작업 할당
   - FAIL: 작업 계속
```

### 수동 호출

```
"Phase 2 완료 상태 확인해줘"
"현재 Phase 진행률 체크해줘"
"체크포인트 리포트 생성해줘"
```

---

## 제약 조건

- WP/SC 문서 형식이 표준을 따라야 함
- 체크박스 마크다운 문법 준수 필요 (`- [ ]`, `- [x]`)
- 시나리오 상태 키워드 정확히 사용 (PASS/FAIL/SKIP)
- 문서가 없는 Phase는 SKIP 처리

---

## 관련 스킬

- environment-validator: 환경 설정 검증 (Phase 시작 전 체크)
- work-package-template: WP 문서 생성 템플릿
- scenario-template: SC 문서 생성 템플릿
