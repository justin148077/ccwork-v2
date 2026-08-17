# Issue #11 (FILTER-2) — 노트 카드에 태그를 표시한다

> 근거: GitHub 이슈 [#11](https://github.com/justin148077/ccwork-v2/issues/11), `docs/features/tag-filter/issues.md`(FILTER-2), `docs/features/tag-filter/prd.md`(US-2, ADR-5), `docs/features/tag-filter/spec-fixed.md`(FR-4)

이 문서는 `test-scenarios` 스킬 실행 결과다. 1단계(시그니처)와 2단계(테스트 시나리오)는 자율 모드(무인 실행)에서 스킬 자신의 판단으로 승인되었다 — 사람의 명시적 승인 없이 진행되었음을 기록해둔다.

## 1단계 — 확정된 시그니처

### 대상 파일

`src/components/NoteItem.tsx`만 변경한다. 다른 파일(`NoteList.tsx`, `App.tsx`, `types/note.ts`)은 이 이슈 범위에서 변경하지 않는다.

### Props — 변경 없음

```ts
interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
```

`note.tags`가 이미 `Note` 타입(`src/types/note.ts`)에 존재하므로 새 prop이 필요 없다. `NoteList.tsx`가 `note`를 그대로 넘기는 기존 호출부도 변경하지 않는다.

### 렌더링 계약 (함수 바디 없이, 규칙만 확정)

```ts
// NoteItem 컴포넌트 내부, 기존 JSX에 추가되는 영역
const tags = note.tags ?? []; // ADR-5: 방어적 처리. Note.tags가 타입상 필수(string[])이지만
// AC-2.2가 요구하는 "필드 자체가 없는 레거시 노트" 런타임 케이스를 방어한다.

// tags.length === 0 이면 태그 영역 컨테이너 자체를 렌더링하지 않는다 (return 안에 아무 것도 없음).
// tags.length > 0 이면 다음 구조로 렌더링한다:
//   <div data-testid="note-tags" className="...">
//     {tags.map((tag) => <span key={tag} className="...">{tag}</span>)}
//   </div>
```

- **정렬하지 않는다** — `tags.map`은 `note.tags` 배열을 저장된 순서 그대로 순회한다(AC-2.1).
- **읽기 전용** — 각 칩(`<span>`)에는 `onClick`, 삭제 버튼(`<button>`)이 없다. `NoteEditor.tsx:116-129`의 편집 가능 칩과 달리 삭제 UI를 갖지 않는다(FR-4, ADR-5).
- **DOM 식별자** — 태그 영역 컨테이너에 `data-testid="note-tags"`를 부여한다. `NoteItem`은 태그 유무와 무관하게 카드 자체(제목/내용/날짜)는 항상 렌더링하므로, `TagFilterBar`처럼 `container.firstChild`로 전체 렌더링 여부를 판단할 수 없다 — AC-2.2("태그 칩 영역이 DOM에 없다")를 검증하려면 이 영역만 스코프해서 존재 여부를 확인할 별도 식별자가 필요하다. 이 프로젝트에 기존 `data-testid` 전례는 없지만, `TagFilterBar`가 `aria-pressed`로 테스트 가능성을 확보한 것과 같은 성격의 결정이다.
- **시각 스타일** — 정확한 Tailwind 클래스(색상 등)는 이 단계에서 고정하지 않는다. `NoteEditor.tsx`의 기존 칩 클래스(`bg-[#dbe4e7] text-[#586064] rounded-full ... text-sm`)를 참고하되, 삭제 버튼이 없으므로 비대칭 패딩(`pl-3 pr-2`)은 그대로 가져오지 않는다. 정확한 값은 Green 단계에서 `design-system` skill로 확정한다(ADR-5).

### 에러 케이스 — 없음

이 이슈는 순수 렌더링만 다룬다. `throw`하는 조건이 없고, `note.tags`가 `undefined`이거나 빈 배열이어도 `?? []` 방어로 예외 없이 처리된다. `console.error`를 호출하는 경로도 없다 — "에러를 던지지 않고 조용히 태그 영역을 생략한다"가 이 이슈의 유일한 실패 처리 방식이다.

## 2단계 — 테스트 시나리오

- [x] **시나리오 1 — AC-2.1: 태그가 있는 노트는 저장된 순서대로 칩이 보인다**

- **종류**: 컴포넌트(RTL)
- **Given**: `tags: ['react', 'work']`인 `Note` 객체 하나
- **When**: `<NoteItem note={...} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />`를 렌더링
- **Then**:
  - `screen.getByTestId('note-tags')`가 존재한다
  - 그 안에서 `react`, `work` 텍스트가 이 순서대로(배열 순서, 정렬 아님) 보인다 — 예: `within(getByTestId('note-tags')).getAllByText(/./)`의 textContent 배열이 `['react', 'work']`와 일치하는지, 또는 각 텍스트의 DOM 순서(`compareDocumentPosition`)로 확인
  - 검증 지점: 1단계에서 확정한 `tags.map` 순회가 정렬 없이 원본 배열 순서를 그대로 쓰는지

- [x] **시나리오 2 — AC-2.2: `tags: []`인 노트는 태그 영역이 렌더링되지 않는다**

- **종류**: 컴포넌트(RTL)
- **Given**: `tags: []`인 `Note` 객체 하나, `console.error`를 `vi.spyOn`으로 감시 중
- **When**: `<NoteItem note={...} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />`를 렌더링
- **Then**:
  - `screen.queryByTestId('note-tags')`가 `null`이다
  - `console.error`가 한 번도 호출되지 않았다
  - 검증 지점: `tags.length === 0` 분기에서 컨테이너 자체가 생략되는지, 렌더링 중 예외/경고가 없는지

- [x] **시나리오 3 — AC-2.2: `tags` 필드 자체가 없는 레거시 노트도 태그 영역이 렌더링되지 않는다**

- **종류**: 컴포넌트(RTL)
- **Given**: `Note`를 만든 뒤 `delete (note as { tags?: string[] }).tags`로 `tags` 필드 자체를 제거한 객체(타입은 `string[]`로 필수지만, 런타임에 필드가 없는 레거시 데이터를 시뮬레이션), `console.error`를 `vi.spyOn`으로 감시 중
- **When**: `<NoteItem note={...} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />`를 렌더링
- **Then**:
  - `screen.queryByTestId('note-tags')`가 `null`이다
  - `console.error`가 한 번도 호출되지 않았다
  - 검증 지점: `note.tags ?? []` 방어가 `undefined`뿐 아니라 필드 부재 상태에서도 동작하는지 (TypeScript 타입만으로는 못 잡는 런타임 방어)

### 수동 시나리오 — 목록 화면에서 육안 확인

- **종류**: 수동
- **Given**: `npm run dev`로 프론트+json-server를 띄우고, 태그가 붙은 노트 여러 개와 태그 없는 노트를 섞어둔 상태
- **When**: 노트 목록 화면을 연다
- **Then**: 각 카드에서 태그 유무와 칩 표시가 일치하는지, 칩을 클릭해도 아무 반응이 없는지(필터 진입 없음, FR-4) 육안으로 확인한다

## 범위 밖 (이 이슈에서 다루지 않음)

- 칩 클릭으로 필터링(FILTER-1, `TagFilterBar`/`NoteList`의 `selectedTag` 로직) — 이미 병합됨, 이 이슈는 손대지 않는다
- 태그 삭제/편집 UI (`NoteEditor.tsx`의 기존 편집 가능 칩과는 별개)
- 공유 `TagChip` 컴포넌트 추출 (ADR-5가 명시적으로 거절)
