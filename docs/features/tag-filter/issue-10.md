# 이슈 #10. 태그 칩을 클릭해 노트 목록을 좁혀본다 (FILTER-1)

> 근거 — GitHub 이슈 #10, [`issues.md`](./issues.md) FILTER-1 절, [`prd.md`](./prd.md) ADR-1~3, [`spec-fixed.md`](./spec-fixed.md) FR-1~3, FR-6.
> 이 문서는 `/test-scenarios 10` 실행 결과(시그니처 확정 → 승인 → 테스트 시나리오 도출)를 기록한다.

## 1단계 — 확정된 시그니처 (승인 완료)

### `src/components/TagFilterBar.tsx` (신규)

```tsx
interface TagFilterBarProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterBar({ selectedTag, onSelectTag }: TagFilterBarProps): JSX.Element | null {
  // notes는 prop이 아니라 useNotes()로 직접 조회
}
```

- `notes`는 prop으로 받지 않고 `useNotes()`로 직접 조회한다 — `App.tsx`는 `NotesProvider`의 자식이 아니라 그것을 렌더링하는 컴포넌트라 `App` 함수 본문에서 `useNotes()`를 호출하면 즉시 throw한다(`NotesContext.tsx:53`). `NoteList`가 이미 같은 이유로 `notes`를 자체 조회한다(`NoteList.tsx:10`).
- 고유 태그가 하나도 없으면(모든 노트의 `tags`가 비어있으면) `null`을 반환해 아무것도 렌더링하지 않는다(FR-1).
- 내부 클릭 핸들러 `handleSelectTag(tag: string | null): void` — `tag`가 이미 `selectedTag`와 같으면 `onSelectTag(null)`(토글 해제), 다르면 `onSelectTag(tag)`를 호출한다. `[전체]` 칩은 `handleSelectTag(null)`을 호출한다.
- 에러 케이스 없음 — 서버 호출이 없는 순수 UI 상태 변경.

### `src/components/NoteList.tsx` (수정)

```tsx
interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTag: string | null; // 신규
}

export function NoteList({ selectedNoteId, onSelect, selectedTag }: NoteListProps): JSX.Element {
  // notes는 기존과 동일하게 useNotes()로 조회(변경 없음)
}
```

- 렌더링 직전 `notes`를 `selectedTag` 기준으로 좁힌 배열을 만들어, 그 배열로 "노트 X개" 카운트와 `NoteItem` 목록을 렌더링한다(ADR-1).

### `src/App.tsx` (수정)

```tsx
export function App(): JSX.Element {
  // 기존 selectedNoteId, isCreating 그대로
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // 신규
}
```

- `Layout`의 `sidebar` prop 안에 `<TagFilterBar selectedTag={selectedTag} onSelectTag={setSelectedTag} />`와 `<NoteList ... selectedTag={selectedTag} />`를 나란히 배치한다(ADR-3).

### 변경 없음 (확인용)

- `src/types/note.ts`, `src/api/notes.ts`, `src/context/NotesContext.tsx`, `src/components/Layout.tsx` — 전부 무변경.

---

## 2단계 — 테스트 시나리오

> 시나리오 텍스트만 다룬다. 실제 `*.test.tsx` 구현은 별도 TDD(Red) 단계.
> 범위: FILTER-1(AC-1.1~1.5)만 다룬다. FR-6(대상 소멸 자동 리셋)은 FILTER-3(#12)에서 별도로 다룬다.

### 컴포넌트(RTL) 시나리오 — `TagFilterBar`

- [x] **시나리오 1 (AC-1.1) — 고유 태그가 `[전체]`와 함께 가나다순으로 렌더링된다**

- **Given** `useNotes()`를 mock해 `tags: ['work']`, `tags: ['ideas']`, `tags: ['work']`인 노트 3개를 반환하도록 설정하고, `selectedTag: null`, `onSelectTag`는 mock 함수로 `<TagFilterBar>`를 렌더링한 상태이고
- **When** 렌더링되면
- **Then** "전체", "ideas", "work" 텍스트가 모두 존재하고 "work"는 한 번만 렌더링된다(중복 제거), DOM 순서는 전체 → ideas → work다
- **검증 지점**: 고유 태그 파생이 `Set`으로 중복을 제거하고 `localeCompare`로 정렬하는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 2 (AC-1.2) — 태그가 하나도 없으면 아무것도 렌더링하지 않는다**

- **Given** `useNotes()`를 mock해 `tags: []`인 노트와 `tags` 필드가 없는 노트만 반환하도록 설정한 상태이고
- **When** `<TagFilterBar selectedTag={null} onSelectTag={mock} />`를 렌더링하면
- **Then** "전체" 텍스트를 포함해 어떤 칩도 DOM에 없다
- **검증 지점**: 고유 태그 배열이 빈 경우 `null`을 반환하는 분기
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 3 (AC-1.3, 클릭 절반) — 태그 칩 클릭 시 `onSelectTag`가 그 태그명으로 호출된다**

- **Given** `work`, `ideas` 태그가 있는 노트들을 반환하도록 mock하고 `selectedTag: null`로 렌더링한 상태이고
- **When** `work` 칩을 클릭하면
- **Then** `onSelectTag`가 정확히 `'work'` 인자로 1회 호출된다
- **검증 지점**: `handleSelectTag`가 미선택 상태에서 클릭한 태그를 그대로 전달하는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 4 (AC-1.4) — 이미 선택된 태그 칩을 다시 클릭하면 `onSelectTag(null)`이 호출된다**

- **Given** `selectedTag: 'work'`로 `<TagFilterBar>`를 렌더링한(이미 `work`가 선택된) 상태이고
- **When** `work` 칩을 다시 클릭하면
- **Then** `onSelectTag`가 `null` 인자로 호출된다
- **검증 지점**: `handleSelectTag`의 토글 해제 분기(`tag === selectedTag`)
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 5 (AC-1.5) — `[전체]` 칩을 클릭하면 `onSelectTag(null)`이 호출된다**

- **Given** `selectedTag: 'work'`로 렌더링한 상태이고
- **When** `전체` 칩을 클릭하면
- **Then** `onSelectTag`가 `null` 인자로 호출된다
- **검증 지점**: `[전체]` 칩의 클릭 핸들러가 항상 `null`을 전달하는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

### 추가 시나리오 — ac-verifier 갭 보강

> `ac-verifier` agent가 Green 구현을 검증한 결과, AC-1.4가 요구하는 "`[전체]` 칩이 활성 상태로 표시된다"는 부분(선택된 칩의 시각적 강조)이 구현·시나리오 어디에도 없었다고 지적했다. 부수적으로 FR-2("다른 태그 클릭 시 자동 전환")를 직접 검증하는 시나리오도 빠져 있었다. 시그니처 변경은 없으므로(내부 `aria-pressed` 속성 추가는 Props 시그니처 밖) 재확정 없이 시나리오만 추가한다.

- [x] **시나리오 10 (AC-1.4 후반부) — 선택된 태그 칩에 활성 표시가 있고 다른 칩은 비활성이다**

- **Given** `work`, `ideas` 태그가 있는 노트들을 반환하도록 mock하고 `selectedTag: 'work'`로 `<TagFilterBar>`를 렌더링한 상태이고
- **When** 렌더링되면
- **Then** `work` 칩은 `aria-pressed="true"`이고 `전체`, `ideas` 칩은 `aria-pressed="false"`다
- **검증 지점**: 칩의 활성 표시가 `selectedTag`와 정확히 일치하는 칩에만 붙는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 11 (AC-1.4 후반부, 기본 상태) — `selectedTag`가 `null`이면 `[전체]` 칩이 활성 상태로 표시된다**

- **Given** `work` 태그가 있는 노트를 반환하도록 mock하고 `selectedTag: null`로 렌더링한 상태이고
- **When** 렌더링되면
- **Then** `전체` 칩은 `aria-pressed="true"`이고 `work` 칩은 `aria-pressed="false"`다
- **검증 지점**: 아무 태그도 선택되지 않은 기본 상태에서 `[전체]`가 활성으로 표시되는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

- [x] **시나리오 12 (FR-2) — 다른 태그 칩을 클릭하면 그 태그로 즉시 전환된다**

- **Given** `react` 태그로 필터링 중인(`selectedTag: 'react'`) 상태이고 `work` 태그를 가진 노트도 있고
- **When** `work` 칩을 클릭하면
- **Then** `onSelectTag`가 `'work'` 인자로 호출된다(토글 해제가 아니라 전환)
- **검증 지점**: `tag === selectedTag` 판정이 클릭한 태그와 선택된 태그가 다를 때는 그대로 새 태그를 전달하는지
- **파일 위치**: `src/components/TagFilterBar.test.tsx`

### 컴포넌트(RTL) 시나리오 — `NoteList`

- [x] **시나리오 6 (AC-1.3, 필터링 절반 + FR-3) — `selectedTag`가 주어지면 해당 태그의 노트만 렌더링하고 카운트도 갱신된다**

- **Given** `useNotes()`를 mock해 `react` 태그 노트 1개, `work` 태그 노트 1개, 태그 없는 노트 1개(총 3개)를 반환하도록 설정하고 `selectedTag: 'react'`로 `<NoteList>`를 렌더링한 상태이고
- **When** 렌더링되면
- **Then** `react` 노트의 제목만 화면에 보이고 나머지 2개는 없으며, "노트 1개" 텍스트가 보인다
- **검증 지점**: `notes.filter((n) => !selectedTag || n.tags?.includes(selectedTag))`가 실제로 적용되고 카운트 문구가 필터링된 길이를 쓰는지
- **파일 위치**: `src/components/NoteList.test.tsx`

- [x] **시나리오 7 (회귀) — `selectedTag`가 `null`이면 기존처럼 모든 노트가 보인다**

- **Given** 태그 유무가 섞인 노트 3개를 반환하도록 mock하고 `selectedTag: null`로 렌더링한 상태이고
- **When** 렌더링되면
- **Then** 3개 노트가 모두 보이고 "노트 3개" 문구가 표시된다
- **검증 지점**: `selectedTag`가 `null`일 때 필터링 없이 기존 동작(전체 노출)이 그대로 유지되는지 — 새 prop 추가가 기존 흐름을 깨지 않는지
- **파일 위치**: `src/components/NoteList.test.tsx`

### 통합(RTL) 시나리오 — `App`

- [x] **시나리오 8 (AC-1.3~1.5 통합) — 필터 바 클릭이 실제로 목록에 반영되고, 재클릭/전체 클릭으로 복귀한다**

- **Given** `api.fetchNotes`를 mock해 `react` 태그 노트 1개, `work` 태그 노트 1개, 태그 없는 노트 1개(총 3개)를 반환하도록 설정한 뒤 `<App>`을 렌더링하고 초기 로딩이 끝난 상태이고
- **When** 필터 바에서 `react` 칩을 클릭하면
- **Then** 노트 목록에는 `react` 노트만 남고 "노트 1개"로 갱신된다
- **When** 이어서 같은 `react` 칩을 다시 클릭하면
- **Then** 다시 3개 노트 모두 보이고 "노트 3개"로 돌아간다(AC-1.4 통합 확인)
- **When** 다시 `react` 칩을 클릭한 뒤 `전체` 칩을 클릭하면
- **Then** 다시 3개 노트 모두 보인다(AC-1.5 통합 확인)
- **검증 지점**: `App`의 `selectedTag` state가 실제로 `TagFilterBar`의 클릭과 `NoteList`의 렌더링 사이를 올바르게 연결하는지 — 개별 컴포넌트 테스트(시나리오 1~7)가 mock으로 건너뛴 연결부
- **파일 위치**: `src/App.test.tsx`

### 수동 시나리오

**시나리오 9 — 실제 브라우저에서 여러 노트에 서로 다른 태그를 붙인 뒤 필터링 확인**

- **Given** json-server(`npm run server`)와 프론트(`npm run dev`)가 함께 떠 있고, 노트 여러 개에 서로 다른 태그(예: `react`, `work`)를 붙여 저장한 상태이고
- **When** 필터 바에서 태그 칩을 클릭하고, 다시 클릭해 해제하고, `[전체]`를 클릭해보면
- **Then** 매번 목록이 올바르게 좁혀지고 복귀되며, 새로고침하면 필터가 `[전체]`로 초기화된다(FR-5)
