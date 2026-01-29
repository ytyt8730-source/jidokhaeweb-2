# session-state

> 세션 상태 저장 및 복원 스킬

## 목적

중단된 작업을 재개할 수 있도록 현재 진행 상태를 파일로 저장하고 복원하는 패턴 제공

## 상태 파일 규칙

```
위치: .claude/session/current-state.json
백업: .claude/session/history/{timestamp}.json
```

## 상태 스키마

```json
{
  "version": "1.0",
  "updated_at": "ISO 날짜",
  "milestone": "M2",
  "current_phase": 3,
  "phase_status": {
    "1": "completed",
    "2": "completed",
    "3": "in_progress",
    "4": "pending",
    "5": "pending"
  },
  "completed_tasks": [
    "카카오 로그인 구현",
    "신청 API 생성"
  ],
  "pending_tasks": [
    "운영자 입금 확인 페이지"
  ],
  "blockers": [],
  "notes": "Phase 3 진행 중 - 입금 확인 목록 페이지 작업 필요"
}
```

## 저장 시점

| 이벤트 | 액션 |
|--------|------|
| Phase 시작 | 상태 저장 |
| Phase 완료 | 상태 저장 + 백업 |
| 주요 Task 완료 | 상태 업데이트 |
| 에러 발생 | 상태 + 에러 정보 저장 |

## 복원 프로세스

```
1. current-state.json 읽기
2. 마지막 작업 위치 확인
3. 사용자에게 현황 보고
4. 재개 확인 후 진행
```

## 사용 예시

### 상태 저장

```typescript
const state = {
  milestone: "M2",
  current_phase: 2,
  phase_status: { "1": "completed", "2": "in_progress" },
  pending_tasks: ["계좌 정보 UI 구현"],
  notes: "RegistrationModal 생성 완료"
};
// .claude/session/current-state.json에 저장
```

### 상태 복원

```
// 세션 시작 시
1. current-state.json 존재 확인
2. 있으면: "이전 작업이 있습니다. M2 Phase 2 (계좌이체 신청) 진행 중이었습니다. 이어서 진행할까요?"
3. 사용자 확인 후 재개
```

## maestro 연동

```
세션 시작 시:
  → session-state 읽기
  → 중단된 작업 있으면 사용자에게 안내
  → 재개/새로 시작 선택

Phase 전환 시:
  → phase-checkpoint로 검증
  → session-state 업데이트
  → 다음 Phase 진행
```

## 호환 에이전트

- maestro (필수)
- 모든 Phase 작업 에이전트

---

dna:
  lineage: [root]
  generation: 1
  fitness_score: 0.5
