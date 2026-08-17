# 태그 기능 이슈 분해

> 근거 문서 — 배경·기술 결정은 [`prd.md`](./prd.md), 동작의 정본은 [`spec-fixed.md`](./spec-fixed.md)에 있다.
> 두 문서와 어긋나는 내용이 이 문서에 있다면 위 두 문서가 우선한다.

**분해 원칙 — 수직 슬라이싱**

- 계층별로 나누지 않는다. 각 이슈는 계층(타입 → 상태 → 컴포넌트 → 저장)을 관통해 그 자체로 화면에서 확인 가능한 동작을 만든다.
- TAG-1이 워킹 스켈레톤이다. ADR-1(`Note.tags` 추가)과 ADR-3(로컬 `useState` + 저장 시 일괄 반영)이 요구하는 구조를 함께 지고 간다.
- 범위는 PRD 4장(Out of Scope) — 필터링/자동완성/정렬/태그 관리 화면/색상/즉시 저장 등 — 을 넘지 않는다.

**[미확정] 새 노트 생성(`isCreating`) 흐름에서의 태그**

`NotesContext.createNote(title, content)`는 `title`/`content`만 받고 `tags`를 받지 않는다(`src/context/NotesContext.tsx:9,29-32`). PRD ADR-3은 `handleSave`의 태그 반영을 `updateNote(id, { title, content, tags })` 경로로만 명시하고, `isCreating` 분기(`createNote` 호출)는 언급하지 않는다.
즉, **새 노트를 만드는 도중 태그를 추가해도 최초 저장 시에는 서버에 반영되지 않는다** — 저장 후 그 노트를 다시 열어(수정 모드) 태그를 추가해야 반영된다. 이 문서의 이슈들은 이 해석(태그 편집은 기존 노트 수정 흐름에서만 서버에 반영됨)을 전제로 한다. 만약 새 노트 생성 시점부터 태그가 반영되어야 한다면 `NotesContext.createNote`의 시그니처 변경이 필요하며, 이는 별도 이슈로 분리해야 한다.

## 이슈 목록

| ID    | 제목                            | 근거                 | 선행  |
| ----- | ------------------------------- | -------------------- | ----- |
| TAG-1 | 노트에 태그를 붙여 저장한다     | US-1 / FR-1, FR-3    | —     |
| TAG-2 | 붙인 태그를 뗀다                | US-2 / FR-2          | TAG-1 |
| TAG-3 | 빈 태그·중복 태그 추가를 막는다 | spec-fixed 검증 규칙 | TAG-1 |

권장 순서: **TAG-1 → (TAG-2, TAG-3 병렬)**

---

## TAG-1. 노트에 태그를 붙여 저장한다

기존 노트를 열어 태그를 하나 입력해 칩으로 확인하고, [저장]을 누르면 서버에 반영되어 다시 열어도 유지되는 것까지가 이 이슈의 범위다. 이 이슈가 워킹 스켈레톤이므로 `Note` 타입에 `tags` 필드를 추가하는 것, `NoteEditor`의 로컬 상태·`useEffect` 동기화·저장 경로를 태그까지 관통하도록 넓히는 구조 작업을 포함한다. 빈 문자열 거부·중복 검사(TAG-3)와 삭제 UI(TAG-2)는 이번 이슈에서 다루지 않는다 — 칩은 아직 삭제(X) 버튼 없이 읽기 전용으로만 보인다.

**영향 범위**

- `src/types/note.ts` — `tags: string[]` 필드 추가 (ADR-1)
- `src/components/NoteEditor.tsx`
  - `tags` 로컬 `useState<string[]>` 추가, 기존 `useEffect` 동기화 로직에 `setTags(selectedNote.tags ?? [])` 추가 — 기존 `db.json` 레코드에 `tags`가 없을 수 있으므로 `?? []` 방어 필요
  - 태그 입력창 + `handleAddTag`(Enter로 확정, 이 단계에서는 trim/중복 검사 없음)
  - 추가된 태그를 칩(삭제 버튼 없이)으로 렌더링
  - `handleSave`에서 `isCreating`이 아닌 경우 `updateNote(id, { title, content, tags })` 호출

**의존 관계** — 없음. TAG-2, TAG-3의 선행.

**완료조건 (Acceptance Criteria)**

**AC-1.1 태그 입력 후 Enter로 태그가 확정되어 칩으로 보인다**

- **Given** 기존 노트를 선택해 `NoteEditor`가 열려 있고 태그 입력란이 비어 있고
- **When** 태그 입력란에 `react`를 입력하고 Enter를 누르면
- **Then** `react` 칩이 화면에 나타나고 입력란은 빈 값으로 돌아간다

**AC-1.2 저장 전에는 로컬 상태에만 존재한다**

- **Given** 노트를 열어 `react` 태그를 추가했지만 아직 [저장]을 누르지 않았고
- **When** 화면 상태를 확인하면
- **Then** `react` 칩은 보이지만 `updateNote`는 아직 호출되지 않는다 (네트워크 요청 없음)

**AC-1.3 저장하면 tags가 서버에 반영되고 새로고침 후에도 유지된다**

- **Given** 노트를 열어 `react` 태그를 추가한 상태이고
- **When** [저장] 버튼을 클릭하면
- **Then** `updateNote(id, { title, content, tags: ['react'] })`가 호출되고, 페이지를 새로고침해 같은 노트를 다시 열면 `react` 칩이 그대로 보인다

**AC-1.4 `tags` 필드가 없는 기존 노트를 열어도 에러 없이 빈 태그 목록으로 표시된다**

- **Given** `db.json`에 `tags` 필드가 없는(마이그레이션 이전) 노트가 있고
- **When** 그 노트를 선택해 `NoteEditor`를 열면
- **Then** 콘솔 에러 없이 태그 영역이 빈 상태로 표시된다

**테스트 계획**

- 컴포넌트(RTL) — 노트 선택 후 태그 입력 + `{Enter}` → 칩이 렌더링되는지
- 컴포넌트 — [저장] 클릭 시 `updateNote`가 `tags`를 포함한 인자로 호출되는지 (mock)
- 컴포넌트 — `tags` 필드가 없는 노트 mock으로 렌더링해도 throw하지 않는지
- 수동 — json-server를 띄운 상태에서 저장 → 새로고침 → 태그 유지 확인

---

## TAG-2. 붙인 태그를 뗀다

TAG-1에서 읽기 전용으로 표시되던 칩에 삭제(X) 버튼을 달고, 클릭 시 로컬 상태에서 제거한 뒤 [저장]으로 서버에 반영하는 흐름을 만든다.

**영향 범위**

- `src/components/NoteEditor.tsx`
  - 칩 마크업에 삭제(X) 버튼 추가
  - `handleRemoveTag(tag: string)` — 로컬 `tags` 배열에서 해당 값 제거
  - 저장 경로는 TAG-1에서 이미 `tags`를 전송하므로 추가 변경 없음

**의존 관계** — TAG-1 완료 후.

**완료조건 (Acceptance Criteria)**

**AC-2.1 칩의 X 버튼을 누르면 해당 태그가 즉시 화면에서 사라진다**

- **Given** `react`, `typescript` 두 태그가 붙은 노트를 열어둔 상태이고
- **When** `react` 칩의 삭제(X) 버튼을 클릭하면
- **Then** `react` 칩은 즉시 사라지고 `typescript` 칩만 남는다 (저장 전)

**AC-2.2 삭제는 저장 전까지 로컬에만 반영된다**

- **Given** `react` 태그를 방금 삭제했고 아직 [저장]을 누르지 않았고
- **When** 화면 상태를 확인하면
- **Then** `updateNote`는 호출되지 않아 서버의 `tags`는 그대로다

**AC-2.3 저장하면 삭제가 서버에도 반영된다**

- **Given** `react`, `typescript`가 붙은 노트에서 `react`를 삭제한 상태이고
- **When** [저장]을 클릭하면
- **Then** `updateNote(id, { title, content, tags: ['typescript'] })`가 호출되고, 새로고침 후 다시 열어도 `react` 칩은 보이지 않는다

**AC-2.4 마지막 남은 태그를 삭제하면 빈 배열로 저장된다**

- **Given** 태그가 `react` 하나만 붙은 노트이고
- **When** 그 태그를 삭제하고 저장하면
- **Then** `tags: []`로 저장되고, 다시 열었을 때 태그 영역이 빈 상태로 보인다

**테스트 계획**

- 컴포넌트(RTL) — 칩의 X 버튼 클릭 → 해당 칩이 DOM에서 사라지는지
- 컴포넌트 — 삭제 후 [저장] 클릭 시 `updateNote`가 해당 태그를 제외한 배열로 호출되는지
- 수동 — 저장 후 새로고침해 삭제가 반영됐는지 확인

---

## TAG-3. 빈 태그·중복 태그 추가를 막는다

TAG-1의 `handleAddTag`는 입력값을 검증 없이 그대로 추가한다. 이 이슈에서 `spec-fixed.md`의 검증 규칙(trim, 빈 문자열 거부, 대소문자 무시 중복 판단, 원문 보존)을 추가한다.

**영향 범위**

- `src/components/NoteEditor.tsx` — `handleAddTag` 내부에 인라인으로 검증 로직 추가 (ADR-4: 별도 유틸/훅으로 추출하지 않음)
  - `trim()` 후 빈 문자열이면 추가 거부 + `console.error` (기존 `title` 검증과 동일한 패턴, `alert` 미사용)
  - 기존 `tags` 배열과 대소문자 무시 비교로 중복이면 추가 거부 + `console.error`
  - 저장되는 값은 trim된 원문 그대로 유지 (소문자 변환 없음)

**의존 관계** — TAG-1 완료 후. TAG-2와는 독립적(병렬 가능).

**완료조건 (Acceptance Criteria)**

**AC-3.1 공백만 입력하면 추가가 거부된다**

- **Given** 태그 입력란이 열려 있고
- **When** 공백만(" ") 입력한 뒤 Enter를 누르면
- **Then** 칩이 추가되지 않고 `console.error`가 호출된다 (`alert` 없음)

**AC-3.2 앞뒤 공백은 제거되고 원문은 그대로 저장된다**

- **Given** 태그 입력란이 비어 있고
- **When** `  React  `를 입력하고 Enter를 누르면
- **Then** 앞뒤 공백이 제거된 `React` 칩이 추가된다 (대소문자는 원문 그대로)

**AC-3.3 대소문자만 다른 태그는 중복으로 처리되어 추가되지 않는다**

- **Given** 이미 `React` 태그가 붙어 있는 노트이고
- **When** 태그 입력란에 `react`를 입력하고 Enter를 누르면
- **Then** 새 칩이 추가되지 않고(`React` 칩 하나만 유지) `console.error`가 호출된다

**AC-3.4 중복 거부 후 저장해도 서버에는 원문 하나만 남는다**

- **Given** `JavaScript` 태그가 붙은 노트에서 `javascript`를 입력해 중복 거부(AC-3.3)를 확인한 뒤
- **When** [저장]을 클릭하면
- **Then** 서버의 `tags` 배열에는 `JavaScript` 하나만 남고 `javascript`는 추가되지 않는다

**테스트 계획**

- 컴포넌트(RTL) — 공백만 입력 후 `{Enter}` → 칩 미생성 + `console.error` spy 호출 확인
- 컴포넌트 — 앞뒤 공백 포함 입력 → trim된 값으로 칩이 렌더링되는지
- 컴포넌트 — 대소문자만 다른 값 입력 → 칩 개수가 늘지 않는지
- 수동 — 저장 후 서버 데이터(`db.json` 또는 네트워크 탭)에 중복 없이 원문 그대로 반영됐는지 확인

---

## GitHub 등록용 명령어

<!-- gh CLI 설치·인증 후 실행. PROJECT_NUMBER·OWNER는 실제 값으로 교체 -->

```bash
gh issue create --title "노트에 태그를 붙여 저장한다" --body-file ./issue-bodies/TAG-1.md
gh issue create --title "붙인 태그를 뗀다" --body-file ./issue-bodies/TAG-2.md
gh issue create --title "빈 태그·중복 태그 추가를 막는다" --body-file ./issue-bodies/TAG-3.md
```
