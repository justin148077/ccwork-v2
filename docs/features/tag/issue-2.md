# TAG-2. 붙인 태그를 뗀다

> 근거: GitHub 이슈 #2, `docs/features/tag/issues.md` (TAG-2 절), `docs/features/tag/prd.md` (US-2, ADR-2, ADR-3), `docs/features/tag/spec-fixed.md`

## 1단계 — 확정된 시그니처

`src/components/NoteEditor.tsx`에 다음 함수를 추가한다. 새 API 함수, `NotesContext` 변경, 새 Props는 없다 — 저장 경로는 TAG-1이 이미 구현한 `updateNote(id, { title, content, tags })`를 그대로 재사용한다 (ADR-2, ADR-3).

```ts
// NoteEditor 컴포넌트 내부 신규 핸들러
const handleRemoveTag = (tag: string): void => { ... };
```

- **동작 조건**: `tags` 로컬 배열에서 인자로 받은 `tag`와 정확히 일치하는 값을 제거한다. 대소문자 무시 비교는 TAG-3의 중복 판단 범위이며, 이 핸들러는 이미 존재하는 값을 그대로 제거하는 것만 다룬다.
- **에러/거부 조건 없음**: 존재하지 않는 tag를 넘겨도 예외를 던지지 않는다 (필터링이라 자연히 no-op). UI상 버튼 클릭으로만 호출되므로 실제로는 발생하지 않는 경로다.
- **서버 반영 없음**: `handleRemoveTag`는 `setTags`만 호출하고 `updateNote`를 호출하지 않는다 (AC-2.2). 저장은 기존 `handleSave`가 그대로 담당하며 시그니처 변경이 없다.
- **칩 마크업**: 각 태그 칩(`<span>`) 안에 삭제 버튼(`<button>`)을 추가하고, `onClick`에서 `handleRemoveTag(tag)`를 호출한다. 새 타입/Props 정의는 없다.

## 2단계 — 테스트 시나리오

### 컴포넌트 (RTL)

- [x] **시나리오 1 — AC-2.1: 칩의 X 버튼 클릭 시 즉시 DOM에서 사라짐**

- **Given** `tags: ['react', 'typescript']`인 노트를 mock으로 렌더링하고 `NoteEditor`가 해당 노트를 선택된 상태로 열려 있다
- **When** `react` 칩의 삭제(X) 버튼을 클릭한다
- **Then** `react` 텍스트를 가진 칩은 DOM에서 사라지고 `typescript` 칩은 그대로 남아 있다
- **검증 지점**: `screen.queryByText('react')`가 칩 컨텍스트에서 `null`, `typescript` 칩은 여전히 존재

- [x] **시나리오 2 — AC-2.2: 삭제는 저장 전까지 로컬에만 반영**

- **Given** 시나리오 1과 동일하게 `react` 칩을 삭제했고 아직 [저장] 버튼을 클릭하지 않았다
- **When** 화면 상태를 확인한다 (저장 버튼을 누르지 않은 시점)
- **Then** mock한 `updateNote`가 호출되지 않는다
- **검증 지점**: `updateNote` mock의 `toHaveBeenCalledTimes(0)`

- [x] **시나리오 3 — AC-2.3: 저장하면 삭제가 서버에도 반영됨**

- **Given** `tags: ['react', 'typescript']`인 노트를 열어 `react` 칩을 삭제한 상태다
- **When** [저장] 버튼을 클릭한다
- **Then** `updateNote(id, { title, content, tags: ['typescript'] })`가 호출된다
- **검증 지점**: `updateNote` mock이 세 번째 인자(`updates.tags`)로 `['typescript']`를 받아 호출됨 (title/content는 기존 값 유지)

- [x] **시나리오 4 — AC-2.4: 마지막 남은 태그를 삭제하면 빈 배열로 저장됨**

- **Given** `tags: ['react']`만 붙은 노트를 열어 `react` 칩을 삭제한 상태다
- **When** [저장] 버튼을 클릭한다
- **Then** `updateNote(id, { title, content, tags: [] })`가 호출된다
- **검증 지점**: `updateNote` mock이 `updates.tags`로 빈 배열을 받아 호출됨

### 수동

**시나리오 5 — AC-2.3: 새로고침 후에도 삭제가 유지됨**

- **Given** json-server(`npm run dev`)를 띄운 상태에서 `react`, `typescript` 태그가 붙은 노트를 연다
- **When** `react` 칩을 삭제하고 [저장]을 클릭한 뒤 페이지를 새로고침해 같은 노트를 다시 연다
- **Then** `typescript` 칩만 보이고 `react` 칩은 보이지 않는다

## 범위 밖 (이번 이슈에서 다루지 않음)

- trim/빈 문자열 거부, 대소문자 무시 중복 판단 (TAG-3 범위)
- 태그 추가(`handleAddTag`) 관련 시나리오 (TAG-1에서 이미 커버)
