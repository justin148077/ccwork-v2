# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + TypeScript + Vite 노트 앱 실습 프로젝트. JSON Server를 가짜 백엔드로 사용하는 간단한 CRUD 앱 (목록/생성/수정/삭제).

## Commands

```bash
npm run dev        # Vite 프론트(5173) + json-server(3001) 동시 실행
npm run server      # json-server만 실행 (db.json 감시)
npm run build        # tsc 타입체크 후 vite build
npm run lint          # eslint --fix
npm run format         # prettier --write
npm test                # vitest run (전체 테스트 1회 실행)
npm run test:watch       # vitest watch 모드
```

단일 테스트 파일 실행: `npx vitest run <path>` (예: `npx vitest run src/components/NoteItem.test.tsx`)

주의: 앱은 `http://localhost:3001`의 json-server에 의존한다. `npm run dev`로 프론트만 켜져 있으면 API 호출이 실패한다.

## Git 커밋 규칙

husky + lint-staged + commitlint로 강제됨 (`.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.cjs`).

- **pre-commit**: staged된 `*.{js,jsx,ts,tsx}`에 `eslint --fix`, `*.{js,jsx,ts,tsx,css,md,json}`에 `prettier --write` 자동 실행.
- **commit-msg**: Conventional Commits 형식(`type: subject`) 강제.
  - `type`은 `build/chore/ci/docs/feat/fix/init/perf/refactor/revert/style/test` 중 하나.
  - 제목(subject) 필수, 본문(body) 필수 + 최소 2줄.
  - `git commit -m "type: 제목" -m "본문 1줄" -m "본문 2줄"` 형태로 커밋할 것 — `-m` 하나만 쓰면 본문 부족으로 거부됨.

## Architecture

```
src/
├── api/notes.ts          # fetch 기반 API 함수 (CRUD)
├── context/NotesContext.tsx  # 전역 상태: notes/isLoading/error + CRUD 액션
├── components/           # Layout, NoteList, NoteItem, NoteEditor
├── types/note.ts          # Note 타입 정의
└── App.tsx                # 선택된 노트 id / 작성 모드 로컬 상태 보유
```

데이터 흐름: `NotesProvider`(context)가 마운트 시 `fetchNotes()`로 초기 로드 → `notes/isLoading/error`를 context로 노출. 컴포넌트는 `useNotes()` 훅으로 구독하고, CRUD는 context의 `createNote/updateNote/deleteNote`를 통해서만 수행한다 (컴포넌트가 `api/notes.ts`를 직접 호출하지 않음). 선택된 노트 id와 "새 노트 작성 중" 여부는 context가 아니라 `App.tsx`의 로컬 `useState`로 관리되고 props로 내려간다 — 서버 데이터(notes)와 UI 전용 상태(selection)를 분리하는 의도적 구조.

## State Management

- 서버 데이터: React Context (`NotesContext`) + `useState`, 별도 상태관리 라이브러리 없음. reducer/useReducer 없이 각 액션 함수가 직접 `setNotes`로 갱신.
- 낙관적 업데이트 없음: API 응답을 받은 뒤에만 `setNotes` 갱신 (`createNote`/`updateNote`/`deleteNote` 모두 await 후 state 반영).
- UI 로컬 상태(선택된 id, 편집 중인 폼 값, `isSaving` 플래그 등)는 각 컴포넌트/`App.tsx`에 `useState`로 유지하고 context에 넣지 않는다.
- context와 컴포넌트의 CRUD 액션명은 API 함수명(`createNote`/`updateNote`/`deleteNote`)과 동일하게 맞춘다 — `add`/`edit`/`remove` 같은 동의어를 쓰지 않는다.

## API 호출 패턴 (`src/api/notes.ts`)

- 함수형 export, axios 없이 순수 `fetch` 사용. base URL은 `const API_URL = 'http://localhost:3001'`로 파일 상단에 하드코딩 (환경변수 미사용).
- 모든 함수가 `res.ok` 체크 후 실패 시 `throw new Error('...')` — 에러 메시지는 한국어로 통일 (예: `'노트를 불러오는데 실패했습니다'`).
- `createNote`/`updateNote`는 함수 내부에서 `new Date().toISOString()`으로 `createdAt`/`updatedAt`을 채운다 (호출부에서 넘기지 않음).
- 이 프로젝트에 API 함수를 추가할 때는 이 패턴(파일 상단 `API_URL`, `res.ok` 체크, 한국어 `Error` throw)을 그대로 따를 것.
- 에러 처리는 `alert()` 대신 `console.error()`만 사용 — 사용자 팝업 없이 콘솔 로깅으로 통일 (`NoteEditor.tsx`의 `handleSave` 참고).

## 컴포넌트 구현 패턴

- **Named export** 함수 컴포넌트로 통일 (`export function ComponentName(...)`), 파일명 = 컴포넌트명. `App.tsx`를 포함해 `export default`는 쓰지 않는다.
- Props 타입은 `interface <ComponentName>Props { ... }`로 컴포넌트 바로 위에 선언.
- 스타일링은 Tailwind CSS v4 유틸리티 클래스 (`@theme` 커스텀 토큰은 `src/index.css` 참고: `bg-card`, `text-foreground`, `border-border` 등). 인라인 `style` 속성은 Tailwind에 없는 값(예: `Layout.tsx`의 커스텀 폰트, `calc(100vh - 65px)`)에만 예외적으로 사용.
- JSX 섹션마다 한글 주석으로 구획 표시 (`{/* 헤더 */}`, `{/* 버튼 영역 */}` 등) — 기존 파일들의 일관된 스타일.
- 리스트/폼 컴포넌트는 로딩/에러/빈 상태를 개별 early return으로 처리 (`NoteList.tsx` 참고).
- 에러/유효성 검사 실패는 `alert()`가 아니라 `console.error()`로만 처리한다.

## 네이밍 패턴

- 컴포넌트: `PascalCase` (`NoteItem`, `NoteEditor`)
- 함수/변수/훅: `camelCase`, 커스텀 훅은 `use` 접두사 (`useNotes`)
- 이벤트 핸들러: `handle` 접두사 (`handleSave`, `handleSelectNote`), props로 전달되는 콜백은 `on` 접두사 (`onSelect`, `onDelete`, `onDone`)
- 타입/인터페이스: `PascalCase`, props 인터페이스는 `<Component>Props`
- boolean 상태/props는 `is` 접두사로 통일 (`isLoading`, `isSaving`, `isCreating`, `isSelected`)
- CRUD 액션명은 `create`/`update`/`delete` 접두사로 통일 (API 함수, context 함수 모두 동일)

## 발견된 불일치 / 잠재 이슈

- **`NoteEditor.tsx`의 useEffect 의존성 문제** (`src/components/NoteEditor.tsx:19-27`): deps 배열이 `[selectedNoteId, isCreating]`인데 effect 내부에서는 `selectedNote`(= `notes.find(...)`로 매 렌더 새로 계산되는 값)를 참조한다. `react-hooks/exhaustive-deps` 규칙이 `eslint-disable-line`으로 억제되어 있음. `notes` 배열이 갱신된 뒤(`updateNote` 성공 등) 같은 `selectedNoteId`를 유지 중이면 폼이 최신 데이터로 재동기화되지 않을 수 있어 의도적 억제가 맞는지 확인 필요.
- **테스트 부재**: `vitest`, `@testing-library/react`, `test-setup.ts`가 설정되어 있지만 실제 `*.test.ts(x)` 파일이 하나도 없다. 테스트를 추가할 때 이 설정을 그대로 사용하면 된다.
- **`Note` 타입에 의도적 미완성 표시**: `src/types/note.ts`에 `tags` 필드가 "강의에서 추가할 것"이라는 한글 주석과 함께 없는 상태로 남아 있음 — 향후 실습에서 채워질 자리이므로 임의로 추가하지 말 것.
