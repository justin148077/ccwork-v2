> 근거 문서 — [`prd.md`](../prd.md), [`spec-fixed.md`](../spec-fixed.md), [`issues.md`](../issues.md)

FILTER-1의 `selectedTag`를 화면에 그대로 쓰지 않고, "지금 선택된 태그가 현재 고유 태그 목록에 여전히 있는지"를 매 렌더 파생시켜(`activeTag`) 필터 하이라이트와 목록 필터링에 사용하도록 바꾼다(ADR-4). `useEffect`로 state를 되돌리지 않는다.

## 영향 범위

- `src/App.tsx`
  - `notes`로부터 고유 태그 목록(`uniqueTags`)을 계산 — `TagFilterBar` 내부 계산과 같은 로직이 중복되지만 ADR-1이 인지하고 감수한 트레이드오프
  - `const activeTag = selectedTag && uniqueTags.includes(selectedTag) ? selectedTag : null` 파생
  - `TagFilterBar`/`NoteList`에 기존 `selectedTag` 대신 `activeTag`를 전달

## 의존 관계

FILTER-1 완료 후(선택 상태·컴포넌트 구조가 이미 있어야 함).

## 완료조건 (Acceptance Criteria)

**AC-3.1 필터링 중인 태그를 가진 마지막 노트를 삭제하면 필터가 자동으로 전체로 돌아간다**

- Given `react` 태그가 붙은 노트가 1개뿐이고 그 태그로 필터링 중이며
- When 그 노트를 삭제하면
- Then 노트 목록에 남은(태그 없는 포함) 모든 노트가 다시 보이고, 필터 바에서 `[전체]` 칩이 활성 상태로 표시되며 `react` 칩은 더 이상 존재하지 않는다

**AC-3.2 필터링 중인 태그가 다른 노트에도 남아있으면 자동 리셋되지 않는다**

- Given `react` 태그가 붙은 노트가 2개 있고 그 중 하나로 필터링 중이며
- When `react` 태그가 붙은 노트 중 1개를 삭제하면
- Then 여전히 `react`로 필터링된 상태가 유지되고, 남은 `react` 노트 1개만 보인다

## 테스트 계획

- 통합(RTL, `App`) — `NotesProvider` + mock API로 노트 삭제를 실제로 트리거해 AC-3.1/3.2 확인
- 수동 — 태그를 편집해 마지막 남은 태그를 떼어냈을 때도(삭제가 아니라 태그 제거 경로) 동일하게 리셋되는지 확인
