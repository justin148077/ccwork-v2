> 근거 문서 — [`prd.md`](../prd.md), [`spec-fixed.md`](../spec-fixed.md), [`issues.md`](../issues.md)

각 노트 카드(`NoteItem`)에 그 노트의 태그를 읽기 전용 칩으로 보여준다. 클릭 동작은 없다 — 필터 진입은 FILTER-1의 상단 바에서만 가능하다(spec-fixed FR-4). `TagFilterBar`/필터링 로직과 무관하게 독립적으로 완결되는 슬라이스라 FILTER-1과 병렬로 진행할 수 있다.

## 영향 범위

- `src/components/NoteItem.tsx`
  - `note.tags`를 읽기 전용 칩으로 렌더링(삭제 버튼 없음, 클릭 핸들러 없음)
  - `note.tags`가 없거나 빈 배열이면 태그 영역 자체를 렌더링하지 않음(ADR-5, `tags ?? []` 방어)
  - 시각 스타일은 `NoteEditor.tsx`의 기존 칩 클래스를 참고해 맞추되, 정확한 색상은 구현 시 `design-system` skill로 확정(ADR-5)

## 의존 관계

없음. FILTER-1과 독립.

## 완료조건 (Acceptance Criteria)

**AC-2.1 노트 카드에 그 노트의 태그가 칩으로 보인다**

- Given `tags: ['react', 'work']`인 노트가 있고
- When 노트 목록이 렌더링되면
- Then 해당 카드에 `react`, `work` 칩이 보인다(저장된 배열 순서 그대로, 정렬하지 않음)

**AC-2.2 태그가 없는 노트의 카드에는 태그 영역이 보이지 않는다**

- Given `tags: []`인 노트와 `tags` 필드 자체가 없는(레거시) 노트가 있고
- When 노트 목록이 렌더링되면
- Then 두 카드 모두 태그 칩 영역이 DOM에 없고 콘솔 에러도 없다

## 테스트 계획

- 컴포넌트(RTL) — `tags`가 있는 노트를 렌더링해 칩 텍스트가 보이는지
- 컴포넌트 — `tags: []`, `tags: undefined` 노트를 각각 렌더링해도 throw하지 않고 칩 영역이 없는지
- 수동 — 실제 여러 노트에 태그를 붙인 뒤 목록 화면에서 한눈에 보이는지 확인
