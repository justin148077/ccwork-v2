# 버그 #8. 노트 저장 시 tag가 빈 배열로 전달되어 재조회 시 사라짐

> 근거 — GitHub 이슈 #8, [`issues.md`](./issues.md) 상단 "[미확정] 새 노트 생성(`isCreating`) 흐름에서의 태그" 절, [`prd.md`](./prd.md) ADR-3.
> 이 문서는 `/test-scenarios 8` 실행 결과(시그니처 확정 → 승인 → 테스트 시나리오 도출)를 기록한다.
> TAG-1/2/3(`issue-1.md`/`issue-2.md`/`issue-3.md`)이 이미 검증한 "기존 노트 수정" 경로는 재검증하지 않는다 — 이 이슈는 `issues.md`가 범위 밖으로 명시했던 "새 노트 생성(`isCreating`)" 경로만 다룬다.

## 1단계 — 확정된 시그니처 (승인 완료)

### `src/context/NotesContext.tsx`

```ts
interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}
```

- `createNote`에 `tags?: string[]` 파라미터 추가 (세 번째, optional).
- 내부에서 `api.createNote({ title, content, tags })` 호출 — `tags`가 `undefined`면 `api/notes.ts`의 기존 `note.tags ?? []` 방어가 그대로 적용되므로 이 함수 자체에서 별도 기본값 처리를 하지 않는다.
- `updateNote`/`deleteNote` — **변경 없음**.

### `src/api/notes.ts`

변경 없음 — `createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & { tags?: string[] })`는 이미 `tags`를 지원한다.

### `src/components/NoteEditor.tsx`

`handleSave` — 기존 시그니처 유지, `isCreating` 분기 바디만 확장:

```ts
async function handleSave(): Promise<void>;
```

- `await createNote(title, content)` → `await createNote(title, content, tags)`로 변경.
- `updateNote` 분기(`isCreating`이 아닌 경우)는 **변경 없음** — TAG-1에서 이미 `tags`를 포함해 호출하고 있음.

`useEffect` 동기화 로직 — 기존 시그니처(`useEffect(() => { ... }, [selectedNoteId, isCreating])`) 그대로, `else if (isCreating)` 분기 바디에 한 줄 추가:

```ts
} else if (isCreating) {
  setTitle('');
  setContent('');
  setTags([]); // 추가
}
```

- 다른 노트를 편집하다가 [새 노트]로 전환했을 때 이전 노트의 `tags`가 새 노트 폼에 남아있는 것을 방지 (이번 수정으로 create 경로가 실제로 `tags`를 전송하게 되면서 드러나는 인접 결함).

### 변경 없음 (확인용)

- `NoteEditorProps` — `selectedNoteId`/`isCreating`/`onDone` 그대로.
- 새로운 에러 케이스 없음 — 기존 `try/catch`의 `console.error('저장에 실패했습니다', e)`가 `createNote` 실패까지 그대로 커버.

---

## 2단계 — 테스트 시나리오

> 시나리오 텍스트만 다룬다. 실제 `*.test.tsx` 구현은 별도 TDD 단계.
> 범위: "새 노트 생성(`isCreating`)" 경로에서의 태그 전달 + 그 경로가 건드리는 `useEffect` 초기화 결함만 다룬다. 태그 삭제(TAG-2)·검증 규칙(TAG-3)·기존 노트 수정 경로(TAG-1)는 이미 검증되었으므로 재검증하지 않는다.

### 컴포넌트(RTL) 시나리오

- [x] **시나리오 1 — 새 노트 작성 중 태그를 추가하고 저장하면 `createNote`가 `tags`를 포함해 호출된다**

- **Given** `isCreating: true`로 `NoteEditor`를 렌더링(선택된 노트 없음), 제목 입력란에 `제목`을 입력하고, 태그 입력란에 `work`를 입력해 `{Enter}`로 칩을 추가한 상태이고, `useNotes`의 `createNote`를 mock 함수로 대체했고
- **When** [저장] 버튼을 클릭하면
- **Then** `createNote`가 정확히 `('제목', '', ['work'])` 인자로 1회 호출된다 (content는 미입력이므로 빈 문자열)
- **검증 지점**: `handleSave`의 `isCreating` 분기가 로컬 `tags` state를 세 번째 인자로 넘기는지

- [x] **시나리오 2 — 태그를 추가하지 않고 새 노트를 저장해도 회귀 없이 빈 배열로 호출된다**

- **Given** `isCreating: true`로 `NoteEditor`를 렌더링, 제목만 입력하고 태그는 하나도 추가하지 않은 상태이고, `createNote`를 mock 함수로 대체했고
- **When** [저장] 버튼을 클릭하면
- **Then** `createNote`가 `(title, content, [])` 인자로 호출된다 — 태그 없이 저장하는 기존 흐름이 깨지지 않는다
- **검증 지점**: `tags` 초기 state(`useState<string[]>([])`)가 그대로 전달되는지, 신규 파라미터 추가가 태그 없는 케이스를 망가뜨리지 않는지

- [x] **시나리오 3 — 기존 노트를 편집하다가 [새 노트]로 전환하면 태그 칩이 초기화된다**

- **Given** `tags: ['a', 'b']`인 기존 노트를 선택해 `NoteEditor`에 `a`, `b` 칩이 보이는 상태이고
- **When** `props`를 `isCreating: true`, `selectedNoteId: null`로 바꿔 리렌더링하면(=[새 노트] 전환을 시뮬레이션)
- **Then** `a`, `b` 칩이 더 이상 DOM에 없다 (태그 영역이 빈 상태)
- **검증 지점**: `useEffect`의 `isCreating` 분기에 추가된 `setTags([])`가 실제로 동작하는지 — 없으면 이전 노트의 태그가 새 노트 생성 시 그대로 전송되는 별개의 데이터 누출 버그가 재현됨

- [x] **시나리오 4 (회귀) — 기존 노트 수정 흐름은 `createNote` 시그니처 변경의 영향을 받지 않는다**

- **Given** 기존 노트(`id: 'n1'`, `tags: []`)를 열어 `react` 태그를 추가한 상태이고, `updateNote`를 mock 함수로 대체했고
- **When** [저장] 버튼을 클릭하면
- **Then** `updateNote`가 `('n1', { title, content, tags: ['react'] })` 인자로 호출되고, `createNote`는 호출되지 않는다
- **검증 지점**: `isCreating`/`selectedNoteId` 분기 로직 자체는 이번 변경으로 건드리지 않았음을 확인 (TAG-1 시나리오 4의 축소 재확인)

### 추가 시나리오 — ac-verifier 갭 보강

> `ac-verifier` agent가 Green 구현을 검증한 결과, `NoteEditor.test.tsx`는 `useNotes`를 통째로 mock하므로 "`NoteEditor`가 `createNote(title, content, tags)`를 올바르게 호출하는지"만 검증하고, "`NotesContext.createNote`가 실제로 `tags`를 `api.createNote`에 전달하는지"는 어떤 테스트도 검증하지 않는다고 지적했다. 이 경계가 정확히 이번 버그의 근본 원인이었으므로(`NotesContext.createNote`가 `tags`를 누락하고 `api.createNote`를 호출), `updateNote`에 이미 있는 동일 계층 테스트(`NotesContext.test.tsx`)와 대칭으로 보강한다. 이미 승인된 1단계 시그니처는 변경되지 않으므로 시그니처 재확정 없이 시나리오만 추가.

- [x] **시나리오 7 — `createNote` 호출 시 `tags`가 `api.createNote`에 전달되고 `notes` state에 반영된다**

- **Given** `NotesProvider`로 감싼 테스트 컴포넌트가 있고, `api.fetchNotes`를 mock해 빈 배열을 초기 로드하고, `api.createNote`를 mock해 `tags: ['bug-fix']`가 포함된 노트를 반환하도록 설정했고
- **When** `useNotes().createNote('제목', '내용', ['bug-fix'])`를 호출하면
- **Then** `api.createNote`가 `{ title: '제목', content: '내용', tags: ['bug-fix'] }` 인자로 호출되고, `useNotes().notes`에서 새로 생성된 노트를 찾았을 때 `tags`가 `['bug-fix']`로 반영되어 있다
- **검증 지점**: `NotesContext.createNote`가 세 번째 인자 `tags`를 실제로 `api.createNote` 호출에 포함시키는지 — `NoteEditor.test.tsx`의 mock은 이 경계를 건너뛰므로 이 시나리오가 그 갭을 메운다
- **파일 위치**: `src/context/NotesContext.test.tsx`

### 수동 시나리오

**시나리오 5 — 새 노트 생성 → 저장 → 새로고침 후 태그 유지 확인**

- **Given** json-server(`npm run server`)와 프론트(`npm run dev`)가 함께 떠 있고, [새 노트] 버튼을 눌러 작성 화면을 연 상태이고
- **When** 제목을 입력하고 태그 입력란에 `bug-fix`를 입력해 Enter로 칩을 만든 뒤 [저장]을 클릭하고, 브라우저를 새로고침해 방금 만든 노트를 다시 열면
- **Then** `bug-fix` 칩이 그대로 보이고, `db.json`의 해당 노트 레코드에 `"tags": ["bug-fix"]`가 반영되어 있다 (수정 전에는 `"tags": []`로 저장되어 이 시나리오가 실패했음)

**시나리오 6 — [새 노트] 전환 시 이전 노트의 태그가 섞여 들어가지 않는지 수동 확인**

- **Given** 태그가 붙은 기존 노트 A를 열어 칩이 보이는 상태이고
- **When** [새 노트] 버튼을 클릭한 뒤 제목만 입력하고 바로 [저장]을 클릭하면
- **Then** 새로 생성된 노트에는 노트 A의 태그가 섞여 들어가지 않고 빈 태그로 생성된다
