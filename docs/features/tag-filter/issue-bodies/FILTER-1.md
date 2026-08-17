> 근거 문서 — [`prd.md`](../prd.md), [`spec-fixed.md`](../spec-fixed.md), [`issues.md`](../issues.md)

노트 목록 위에 존재하는 모든 태그를 칩으로 나열하는 필터 바를 새로 만들고, 칩을 클릭하면 그 태그를 가진 노트만 목록에 남는 것까지가 이 이슈의 범위다. 이 이슈가 워킹 스켈레톤이므로 `TagFilterBar` 컴포넌트 신설(ADR-3), `App.tsx`에 `selectedTag` 로컬 상태 추가(ADR-2), `NoteList`가 인라인으로 필터링하는 구조(ADR-1)를 함께 만든다. 필터링 중인 태그를 가진 노트가 모두 사라졌을 때의 자동 리셋(FR-6)은 FILTER-3으로 미룬다.

## 영향 범위

- `src/components/TagFilterBar.tsx` (신규)
  - `notes: Note[]`, `selectedTag: string | null`, `onSelectTag: (tag: string | null) => void` props
  - 고유 태그를 `[...new Set(notes.flatMap((n) => n.tags ?? []))].sort((a, b) => a.localeCompare(b))`로 인라인 계산(ADR-1)
  - 고유 태그가 하나도 없으면 `null`을 반환해 필터 바 자체를 렌더링하지 않음(FR-1)
  - `[전체]` 칩 + 태그 칩들을 렌더링. 칩 클릭 시 `onSelectTag(tag)` 호출, 이미 선택된 태그를 다시 클릭하면 `onSelectTag(null)` 호출(토글 해제)
  - 현재 `selectedTag`(또는 `[전체]`)에 활성 스타일 적용
- `src/components/NoteList.tsx`
  - `selectedTag: string | null` prop 추가
  - 렌더링 전 `notes.filter((n) => !selectedTag || n.tags?.includes(selectedTag))`로 인라인 필터링(ADR-1)
  - "노트 X개" 카운트 문구가 필터링된 배열의 길이를 반영
- `src/App.tsx`
  - `const [selectedTag, setSelectedTag] = useState<string | null>(null)` 추가(ADR-2)
  - `Layout`의 `sidebar` prop 안에 `<TagFilterBar>`와 `<NoteList>`를 나란히 조립(ADR-3)

## 의존 관계

없음. FILTER-3의 선행(FILTER-2는 독립).

## 완료조건 (Acceptance Criteria)

**AC-1.1 태그가 있는 노트가 존재하면 필터 바에 `[전체]`와 고유 태그 칩이 가나다순으로 보인다**

- Given `tags: ['work']`, `tags: ['ideas']`, `tags: ['work']`인 노트 3개가 있고
- When 화면이 렌더링되면
- Then 필터 바에 `[전체]`, `ideas`, `work` 순서로 칩이 보인다(중복 제거, 가나다순)

**AC-1.2 어떤 노트에도 태그가 없으면 필터 바가 보이지 않는다**

- Given 모든 노트의 `tags`가 빈 배열이거나 없고
- When 화면이 렌더링되면
- Then 필터 바(태그 칩 목록) 자체가 DOM에 없다

**AC-1.3 태그 칩을 클릭하면 그 태그를 가진 노트만 목록에 남는다**

- Given `react` 태그가 붙은 노트 1개, `work` 태그가 붙은 노트 1개, 태그 없는 노트 1개가 있고
- When 필터 바에서 `react` 칩을 클릭하면
- Then 노트 목록에는 `react` 노트만 보이고 나머지 2개는 사라지며, "노트 1개" 문구로 갱신된다

**AC-1.4 이미 선택된 태그 칩을 다시 클릭하면 전체로 돌아간다**

- Given `react` 칩을 클릭해 필터링된 상태이고
- When `react` 칩을 한 번 더 클릭하면
- Then 노트 목록에 모든 노트가 다시 보이고 `[전체]` 칩이 활성 상태로 표시된다

**AC-1.5 `[전체]` 칩을 클릭하면 필터가 해제된다**

- Given `react` 태그로 필터링된 상태이고
- When `[전체]` 칩을 클릭하면
- Then 모든 노트가 다시 보인다

## 테스트 계획

- 컴포넌트(RTL, `TagFilterBar` 단독) — notes prop으로 칩 목록/정렬/숨김 렌더링 확인, 클릭 시 `onSelectTag`가 올바른 인자로 호출되는지
- 컴포넌트(RTL, `NoteList` 단독) — `selectedTag` prop 값에 따라 필터링된 notes만 렌더링되는지, 카운트 문구가 갱신되는지
- 통합(RTL, `App`) — `TagFilterBar` 클릭이 실제로 `NoteList`에 반영되는 전체 흐름(AC-1.3~1.5) 확인
- 수동 — json-server를 띄운 상태에서 필터링 후 새로고침하면 `[전체]`로 초기화되는지(FR-5) 확인
