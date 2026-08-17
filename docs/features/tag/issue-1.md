# TAG-1 (GitHub #1). 노트에 태그를 붙여 저장한다

> 근거 — GitHub 이슈 #1, [`issues.md`](./issues.md)의 TAG-1, [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md).
> 이 문서는 `/test-scenarios 1` 실행 결과(시그니처 확정 → 승인 → 테스트 시나리오 도출)를 기록한다.

## 1단계 — 확정된 시그니처 (승인 완료)

### `src/types/note.ts`

```ts
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
```

### `src/components/NoteEditor.tsx` — 로컬 상태 추가

```ts
const [tags, setTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState<string>('');
```

`NoteEditorProps`는 변경 없음 (`selectedNoteId`/`isCreating`/`onDone` 그대로).

### `useEffect` 동기화 로직 확장

기존 시그니처(`useEffect(() => { ... }, [selectedNoteId, isCreating])`) 그대로, 바디에 한 줄 추가:

```ts
setTags(selectedNote.tags ?? []);
```

`?? []`는 마이그레이션 이전 `db.json` 레코드(=`tags` 필드 없음, AC-1.4)를 방어하기 위함.

### `handleAddTag` — 신규 핸들러

```ts
function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>): void;
```

- Enter 키(`e.key === 'Enter'`)에서만 동작, 그 외 키는 무시
- 이 이슈 범위에서는 trim/빈 문자열/중복 검사 없음 (TAG-3 범위) — `tagInput` 값을 그대로 `tags`에 push하고 `tagInput`을 빈 문자열로 리셋
- 에러 케이스 없음 (검증 로직 자체가 TAG-3에서 추가됨)

### `handleSave` — 기존 시그니처 유지, 바디만 확장

```ts
async function handleSave(): Promise<void>;
```

- 기존 `if (!title.trim())` 검증 그대로 유지
- `isCreating`이 아닌 분기에서 `updateNote(selectedNoteId, { title, content })` → `updateNote(selectedNoteId, { title, content, tags })`로 확장
- `isCreating` 분기(`createNote(title, content)`)는 **이번 이슈 범위 밖** — `issues.md` 상단 "[미확정] 새 노트 생성 흐름에서의 태그" 절 그대로, `NotesContext.createNote(title, content)` 시그니처는 변경하지 않음
- 새로운 에러 케이스 없음 — 기존 `try/catch`의 `console.error('저장에 실패했습니다', e)`가 `updateNote` 실패까지 그대로 커버

### 변경 없음 (확인용)

- `src/api/notes.ts`의 `updateNote(id: string, updates: Partial<Note>): Promise<Note>` — ADR-2대로 태그 전용 함수 신설 없음
- `src/context/NotesContext.tsx`의 `updateNote` 액션 시그니처 — ADR-3대로 무변경, `Partial<Note>`가 `tags`를 자연히 포함

---

## 2단계 — 테스트 시나리오

> 시나리오 텍스트만 다룬다. 실제 `*.test.tsx` 구현은 별도 TDD 단계.
> 범위: 이슈 #1(TAG-1)만 다룬다 — 칩 삭제(TAG-2), 빈 문자열/중복 거부(TAG-3) 시나리오는 포함하지 않는다.

### 컴포넌트(RTL) 시나리오

- [x] **시나리오 1 — 태그 입력 후 Enter로 칩이 렌더링된다** (AC-1.1)

- **Given** `tags: []`인 노트를 mock으로 `NoteEditor`를 렌더링, 태그 입력란(`tagInput` 바인딩된 input)이 화면에 있고
- **When** 입력란에 `react`를 입력한 뒤 `{Enter}` 키 이벤트를 발생시키면
- **Then** `react` 텍스트를 포함한 칩 요소가 DOM에 나타나고, 입력란의 value는 다시 빈 문자열이다
- **검증 지점**: `handleAddTag`의 Enter 분기 → `tags` 배열 갱신 → `tagInput` 리셋

- [x] **시나리오 2 — Enter가 아닌 키 입력은 태그를 추가하지 않는다**

- **Given** 태그 입력란에 `react`가 입력된 상태이고
- **When** Enter가 아닌 다른 키(예: Tab, 일반 문자 입력 도중의 keydown)를 발생시키면
- **Then** 칩이 추가되지 않고 입력란의 값은 `react`로 유지된다
- **검증 지점**: `handleAddTag`가 `e.key === 'Enter'` 조건을 실제로 가드하는지

- [x] **시나리오 3 — 저장 전에는 `updateNote`가 호출되지 않는다** (AC-1.2)

- **Given** 노트를 열어 `react` 태그를 칩으로 추가했지만
- **When** [저장] 버튼을 누르지 않은 상태에서 mock한 `updateNote`(`useNotes`의 `updateNote`)의 호출 여부를 확인하면
- **Then** `updateNote`는 호출되지 않는다 (호출 횟수 0)
- **검증 지점**: 태그 추가가 로컬 `tags` state만 바꾸고 서버 호출과 분리되어 있는지

- [x] **시나리오 4 — [저장] 클릭 시 `updateNote`가 `tags`를 포함해 호출된다** (AC-1.3)

- **Given** 기존 노트(`id: 'n1'`, `title: '제목'`, `content: '내용'`, `tags: []`)를 열어 `react` 태그를 추가한 상태이고, `useNotes`의 `updateNote`를 mock 함수로 대체했고
- **When** [저장] 버튼을 클릭하면
- **Then** `updateNote`가 정확히 `('n1', { title: '제목', content: '내용', tags: ['react'] })` 인자로 1회 호출된다
- **검증 지점**: `handleSave`의 `isCreating`이 아닌 분기가 `tags`까지 포함해 `updateNote`를 호출하는지

- [x] **시나리오 5 — `tags` 필드가 없는 노트를 열어도 throw하지 않고 빈 태그 목록으로 표시된다** (AC-1.4)

- **Given** `tags` 필드 자체가 없는 노트 객체(`{ id, title, content, createdAt, updatedAt }`, `tags` 키 없음)를 mock 데이터로 주입해 `NoteEditor`를 렌더링하면
- **When** 렌더링이 완료되면
- **Then** 콘솔 에러(`console.error`) 없이 렌더링되고, 칩이 하나도 없는(태그 영역이 빈) 상태로 표시된다
- **검증 지점**: `useEffect` 동기화의 `selectedNote.tags ?? []` 방어 로직

- [x] **시나리오 6 — 노트를 전환하면 태그 목록도 함께 전환된다** (AC-1.1/US-3 보강)

- **Given** `tags: ['react']`인 노트 A가 열려 `react` 칩이 보이는 상태이고
- **When** `selectedNoteId`를 `tags: ['typescript']`인 노트 B로 바꾸면
- **Then** `react` 칩은 사라지고 `typescript` 칩만 보인다
- **검증 지점**: `useEffect`가 `selectedNoteId` 변경 시 `setTags(selectedNote.tags ?? [])`를 다시 실행하는지 — `CLAUDE.md`에 기록된 기존 `useEffect` deps 이슈와 맞닿아 있어, 이 시나리오가 실패하면 그 이슈가 태그에도 영향을 준다는 신호

### 추가 시나리오 — AC-1.3 갭 보강

> `ac-verifier` agent가 TAG-1 구현을 검증한 결과, AC-1.3 "저장하면 tags가 서버에 반영되고 새로고침 후에도 유지된다" 중 전반부(반영)만 시나리오 4로 커버되고 후반부(새로고침 후 유지)는 자동화 테스트가 없었다(수동 시나리오 7에만 있었고 체크박스가 없어 실행 여부가 추적되지 않음). `/test-scenarios 1`을 재실행해 이 갭만 보강한다 — 이미 승인된 시그니처(위 1단계)는 변경되지 않으므로 시그니처 재확정 없이 시나리오만 추가.

- [x] **시나리오 9 — `updateNote` 서버 응답의 `tags`가 context state에 반영되어 이후 조회 시 유지된다** (AC-1.3 후반부)

- **Given** `NotesProvider`로 감싼 테스트 컴포넌트가 있고, `api.fetchNotes`를 mock해 `tags: []`인 노트 하나(`id: 'n1'`)를 초기 로드하고, `api.updateNote`를 mock해 `tags: ['react']`가 포함된 노트를 반환하도록 설정했고
- **When** `useNotes().updateNote('n1', { title, content, tags: ['react'] })`를 호출하면
- **Then** `useNotes().notes`에서 `id: 'n1'`인 노트를 다시 찾았을 때 `tags`가 `['react']`로 반영되어 있다
- **검증 지점**: `NotesContext.updateNote`가 `api.updateNote`의 서버 응답(`updated`)으로 `notes` 배열의 해당 항목을 정확히 교체하는지(`setNotes((prev) => prev.map(...))`). `NoteEditor`가 노트를 열 때 이 `notes` 배열에서 값을 읽어 칩을 그리므로(`selectedNote.tags`), 이 경로가 맞으면 재조회(=새로고침) 후에도 태그가 보이는 것과 동일한 데이터 흐름이 검증된다.
- **파일 위치**: `src/context/NotesContext.test.tsx` (신규) — 기존 `NoteEditor.test.tsx`는 `useNotes` 자체를 mock하므로 이 시나리오(실제 `NotesProvider` + `api` 계층 통과)와 같은 파일에 둘 수 없다.
- **범위 한계**: 실제 브라우저 새로고침이나 `fetchNotes` 재호출까지 시뮬레이션하지는 않는다 — `fetchNotes`는 이 이슈에서 변경되지 않은 기존 함수이므로 신뢰하고, "서버 응답이 state에 정확히 반영되는가"라는 핵심 계약만 좁혀서 검증한다. → 이 한계는 시나리오 10에서 보강됐다.

- [x] **시나리오 10 — Provider가 재마운트되어 다시 조회해도(=새로고침 시뮬레이션) 반영된 태그가 유지된다** (AC-1.3 후반부, 시나리오 9 보강)

> `ac-verifier`가 시나리오 9를 재검증한 결과, "서버 응답이 state에 반영된다"(증명됨)와 "새로고침 후에도 유지된다"(미증명)는 논리적으로 다른 주장이라고 지적했다. 새로고침은 `NotesProvider`가 통째로 리마운트되어 `fetchNotes()`가 마운트 시 1회 다시 호출되는 것과 동일하므로(`NotesContext.tsx`의 `useEffect(() => { api.fetchNotes()... }, [])`), 이 시나리오는 그 리마운트를 직접 시뮬레이션한다.

- **Given** `NotesProvider`를 마운트해 `api.fetchNotes`가 `tags: []`인 노트를 반환하도록 하고, `updateNote('n1', { ..., tags: ['react'] })`를 호출해 로컬 state를 갱신한 뒤, 이 Provider 인스턴스를 언마운트하고
- **When** `api.fetchNotes`가 이번에는 `tags: ['react']`를 반환하도록(=서버에 저장된 결과를 재조회하는 상황을 흉내) 설정한 채 `NotesProvider`를 새로 마운트하면
- **Then** 새로 마운트된 인스턴스의 `notes`에서 `id: 'n1'` 노트를 찾았을 때 `tags`가 `['react']`다
- **검증 지점**: Provider 리마운트 시 `fetchNotes`가 다시 호출되고 그 결과가 `notes` state를 새로 채우는지 — "새로고침 후 유지"의 클라이언트 측 데이터 흐름 전체(초기 반영 → 리마운트 → 재조회 → 표시)를 자동화로 커버한다.
- **범위 한계**: `api.fetchNotes`/`api.updateNote`를 여전히 mock하므로, json-server가 실제로 PATCH된 값을 디스크에 영속화하는지 자체는 검증하지 않는다 — 그 마지막 한 칸(실제 서버 영속화)은 수동 시나리오 7의 몫으로 남는다.

### 수동 시나리오

**시나리오 7 — 저장 → 새로고침 후 태그 유지 확인** (AC-1.3)

- **Given** json-server(`npm run server`)와 프론트(`npm run dev`)가 함께 떠 있고, 기존 노트 하나를 열어둔 상태이고
- **When** 태그 입력란에 `react`를 입력해 Enter로 칩을 만든 뒤 [저장]을 클릭하고, 브라우저를 새로고침해 같은 노트를 다시 열면
- **Then** `react` 칩이 그대로 보이고, `db.json`의 해당 노트 레코드에 `"tags": ["react"]`가 반영되어 있다

**시나리오 8 — 마이그레이션 이전 데이터로 수동 확인** (AC-1.4)

- **Given** `db.json`에서 노트 레코드 하나의 `tags` 필드를 직접 지운(또는 애초에 없는) 상태이고
- **When** 앱에서 그 노트를 선택하면
- **Then** 브라우저 콘솔에 에러가 없고, 태그 영역이 빈 상태로 보인다
