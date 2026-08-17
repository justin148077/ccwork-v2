# TAG-3. 빈 태그·중복 태그 추가를 막는다

> 근거: GitHub 이슈 #3, `docs/features/tag/issues.md` (TAG-3 절), `docs/features/tag/spec-fixed.md` (입력값 검증 / 중복 처리 절)

## 1단계 — 확정된 시그니처

`src/components/NoteEditor.tsx`의 기존 `handleAddTag`에 인라인 검증 로직을 추가한다 (ADR-4: 별도 유틸/훅으로 추출하지 않음). 함수 시그니처(파라미터·반환 타입) 자체는 변경되지 않는다 — 내부 분기 조건만 추가된다. 새 API 함수, `NotesContext` 변경, `NoteEditorProps` 변경은 없다.

```ts
// src/components/NoteEditor.tsx — handleAddTag, 시그니처는 기존과 동일
const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>): void => {
  // 1. e.key !== 'Enter' → return (기존과 동일, 변경 없음)
  // 2. trim 후 빈 문자열이면 추가 거부
  //    조건: tagInput.trim() === ''
  //    조치: console.error('태그를 입력해주세요') 후 return (setTags 호출 안 함)
  // 3. 대소문자 무시 중복 검사
  //    조건: tags.some((t) => t.toLowerCase() === tagInput.trim().toLowerCase())
  //    조치: console.error('이미 추가된 태그입니다') 후 return (setTags 호출 안 함)
  // 4. 위 두 조건을 모두 통과하면
  //    setTags([...tags, tagInput.trim()])  // 원문 그대로, trim만 적용 (소문자 변환 없음)
  //    setTagInput('')
};
```

- **에러 케이스**: `console.error`만 사용, `alert` 없음 — 기존 `handleSave`의 `title` 검증과 동일한 패턴.

| 조건                        | 로그 메시지                | 칩 추가 여부               |
| --------------------------- | -------------------------- | -------------------------- |
| `tagInput.trim() === ''`    | `'태그를 입력해주세요'`    | 거부                       |
| `tags`와 대소문자 무시 중복 | `'이미 추가된 태그입니다'` | 거부                       |
| 위 두 조건 모두 아님        | (로그 없음)                | `tagInput.trim()`으로 추가 |

- **변경 없음**: `NoteEditorProps`, `api/notes.ts`, `NotesContext.tsx`. 저장 경로는 TAG-1이 구현한 `updateNote(id, { title, content, tags })`를 그대로 재사용한다.

## 2단계 — 테스트 시나리오

### 컴포넌트 (RTL)

- [x] **시나리오 1 — AC-3.1: 공백만 입력하면 추가가 거부된다**

- **Given** 기존 노트를 선택해 `NoteEditor`가 열려 있고 태그 입력란이 비어 있다
- **When** 태그 입력란에 `' '`(공백만)를 입력하고 `{Enter}`를 누른다
- **Then** 칩이 추가되지 않고 `console.error`가 `'태그를 입력해주세요'`로 호출된다
- **검증 지점**: `console.error` spy가 호출됨, 태그 영역에 새 칩 텍스트가 렌더링되지 않음, `tagInput`이 그대로거나 리셋 여부는 검증하지 않음(시그니처에 명시 안 됨)

- [x] **시나리오 2 — AC-3.2: 앞뒤 공백은 제거되고 원문은 그대로 저장된다**

- **Given** 기존 노트를 선택해 `NoteEditor`가 열려 있고 태그 입력란이 비어 있다
- **When** 태그 입력란에 `'  React  '`를 입력하고 `{Enter}`를 누른다
- **Then** 앞뒤 공백이 제거된 `React` 칩이 화면에 나타나고 입력란은 빈 값으로 돌아간다
- **검증 지점**: `screen.getByText('React')`가 존재 (앞뒤 공백 없는 정확한 텍스트), `console.error`는 호출되지 않음

- [x] **시나리오 3 — AC-3.3: 대소문자만 다른 태그는 중복으로 처리되어 추가되지 않는다**

- **Given** `tags: ['React']`가 붙은 노트를 mock으로 렌더링해 `NoteEditor`가 열려 있다
- **When** 태그 입력란에 `react`를 입력하고 `{Enter}`를 누른다
- **Then** 새 칩이 추가되지 않아 `React` 칩 하나만 남고, `console.error`가 `'이미 추가된 태그입니다'`로 호출된다
- **검증 지점**: 태그 영역 내 칩 개수가 1개로 유지됨 (`react` 텍스트의 새 칩이 렌더링되지 않음), `console.error` spy 호출 확인

### 수동

**시나리오 4 — AC-3.4: 중복 거부 후 저장해도 서버에는 원문 하나만 남는다**

- **Given** json-server(`npm run dev`)를 띄운 상태에서 `JavaScript` 태그가 붙은 노트를 연다
- **When** 태그 입력란에 `javascript`를 입력해 중복 거부(AC-3.3, 칩이 추가되지 않고 콘솔에 에러가 찍히는 것)를 확인한 뒤 [저장]을 클릭한다
- **Then** `db.json` 또는 네트워크 탭에서 해당 노트의 `tags` 배열에 `JavaScript` 하나만 남아 있고 `javascript`는 추가되지 않았음을 확인한다

## 범위 밖 (이번 이슈에서 다루지 않음)

- 태그 삭제(`handleRemoveTag`) 관련 시나리오 (TAG-2에서 이미 커버)
- 검증 로직을 별도 유틸/훅으로 추출하는 리팩터링 (ADR-4로 금지됨)
- trim/중복 검사 외의 추가 검증 규칙(길이 제한, 특수문자 제한 등) — PRD/spec-fixed에 명시되지 않음
