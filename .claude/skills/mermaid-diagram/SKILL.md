---
name: mermaid-diagram
description: 이 프로젝트(React 19 + TypeScript notes 앱)의 src/ 디렉토리를 분석해서 Mermaid로 컴포넌트 의존성 그래프와 상태 흐름을 시각화하고, docs/architecture/index.html에 브라우저에서 바로 열 수 있는 self-contained HTML로 저장한다. 사용자가 "프로젝트 구조를 시각화해줘", "아키텍처 다이어그램 만들어줘/갱신해줘", "컴포넌트 의존성 보여줘/그려줘", "상태 흐름 정리해줘" 같이 말하거나, mermaid/다이어그램/아키텍처 문서를 언급하며 구조 파악을 요청할 때 사용한다. src/ 구조가 이전 실행 이후 바뀌었을 수 있으므로 항상 현재 코드를 다시 읽고 그린다 — 과거에 생성된 docs/architecture/index.html이나 이 문서에 적힌 예시 그래프를 그대로 재사용하지 않는다.
---

# mermaid-diagram

이 프로젝트의 `src/` 구조를 Mermaid 다이어그램 2종(컴포넌트 의존성 / 상태 흐름)으로 시각화해서 `docs/architecture/index.html`에 저장하는 스킬.

## 핵심 원칙

**다이어그램을 하드코딩하지 말고 매번 재분석할 것.** 이 프로젝트는 실습용 코드베이스라 구조가 계속 바뀐다 (예: `src/types/note.ts`에 `tags` 필드가 추후 추가될 예정, 테스트 파일이 추가될 수 있음 — `CLAUDE.md` 참고). 이 문서에 적힌 구체적 관계(아래 "현재 구조 참고")는 스킬을 작성한 시점의 스냅샷일 뿐이므로, 실행할 때는 항상 `src/` 파일을 실제로 다시 읽어서 import 관계와 `useNotes()` 호출을 확인한 뒤 그린다.

## 분석 절차

1. `src/` 아래 모든 `.ts`/`.tsx` 파일을 읽는다 (`node_modules`, `dist`, 빌드 산출물은 제외).
2. 각 파일의 import 문을 분석해서 실제 의존성 그래프를 만든다.
3. Context API 구독 관계(`useNotes()` 훅 호출)는 import 그래프만으로 드러나지 않으므로 별도로 표시한다 — 일반 import는 실선 화살표, context 구독은 점선 화살표로 구분.
4. 상태를 두 종류로 분류한다:
   - **서버 상태**: `NotesContext`가 들고 있는 `notes`/`isLoading`/`error`, CRUD 액션(`createNote`/`updateNote`/`deleteNote`)
   - **로컬 UI 상태**: 각 컴포넌트가 `useState`로 들고 있는 값 (예: `App.tsx`의 `selectedNoteId`/`isCreating`, `NoteEditor.tsx`의 `title`/`content`/`isSaving`)
   이 프로젝트의 의도적 설계(서버 데이터와 UI 전용 상태 분리, `CLAUDE.md`의 "State Management" 참고)이므로 다이어그램에서도 이 구분을 유지한다.
5. CRUD 흐름(예: 저장 버튼 클릭 → context 액션 → `api/notes.ts`의 fetch → `localhost:3001` json-server → 응답 → `setNotes` 갱신 → 리렌더)과 선택 흐름(예: 노트 클릭 → 상위 컴포넌트의 로컬 상태 갱신 → 하위 컴포넌트에 prop으로 전달 → `useEffect`로 폼 동기화)을 추적한다.
6. `CLAUDE.md`의 "발견된 불일치 / 잠재 이슈"에 적힌 것처럼, 코드에 알려진 이슈(예: `useEffect` 의존성 배열 문제)가 있다면 다이어그램 옆에 짧게 주석으로 표시하면 좋다 — 단, 실제로 해당 코드가 그 상태일 때만 표시하고, 코드가 수정되어 해소됐다면 표시하지 않는다.

## 다이어그램 구성 (2개)

### 1. 컴포넌트 의존성 그래프

Mermaid `flowchart` 사용. `subgraph`로 계층을 구분한다 (entry / App / context / components / api / types 등, 실제 디렉토리 구조에 맞춰서). 일반 import는 실선 화살표(`-->`), context 구독은 점선 화살표(`-.->`)로 구분한다.

### 2. 상태 흐름 다이어그램

Mermaid `flowchart`(상태별 노드 + 화살표) 또는 `sequenceDiagram`(사용자 액션 → 컴포넌트 → context → api → json-server → 응답 → 리렌더 순서) 중 흐름을 더 명확히 보여주는 쪽을 선택한다. 서버 상태와 로컬 UI 상태를 색상이나 subgraph로 시각적으로 구분한다.

## 출력 파일

- 경로: `docs/architecture/index.html` (디렉토리가 없으면 생성)
- 단일 self-contained HTML 파일 하나로 작성한다:
  - Mermaid.js는 CDN `<script type="module">`로 로드 (예: `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs`), 로드 후 `mermaid.initialize({ startOnLoad: true })` 호출
  - 각 다이어그램은 `<pre class="mermaid">...</pre>` 블록으로 삽입 (소스를 그대로 두고 브라우저가 렌더링하게 함 — 이미지로 미리 렌더링해서 넣지 않는다)
  - 두 다이어그램 사이에 제목과 1~2문장 설명을 붙여서 각각이 무엇을 보여주는지 명시
  - Tailwind 등 빌드 의존성 없이 순수 HTML/CSS만 사용 (프로젝트 빌드 과정과 무관하게 `file://`로 바로 열람 가능해야 함)
  - 한글 라벨/설명 사용 (프로젝트 컨벤션과 일치)
  - 최소한의 스타일링만 적용 (가독성 있는 폰트, 여백, 다이어그램이 잘리지 않도록 `overflow-x: auto` 등)

## 완료 후

- 생성/갱신된 `docs/architecture/index.html` 경로를 사용자에게 알려준다.
- 가능하면 브라우저로 열어서 다이어그램이 실제로 렌더링되는지 확인한다 (`open docs/architecture/index.html` 등).
- 이후 `src/` 구조가 바뀌면 이 스킬을 다시 실행해서 다이어그램을 최신 상태로 갱신한다.

## 하지 않을 것

- 실제 런타임 동작(네트워크 요청 성공/실패, 실제 API 응답 등)을 시뮬레이션하지 않는다 — 정적 코드 분석 기반의 다이어그램이다.
- `node_modules`, `dist`, 빌드 산출물은 분석 대상에서 제외한다.
- 다이어그램을 PNG/SVG 이미지로 미리 렌더링해서 삽입하지 않는다 — Mermaid 소스 그대로 HTML에 넣어 브라우저가 렌더링하게 한다.
- 과거에 생성된 다이어그램이나 이 문서의 예시를 그대로 복사하지 않는다 — 항상 현재 `src/`를 다시 읽고 그린다.
