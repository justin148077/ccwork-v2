# 태그 필터 이슈 분해

> 근거 문서 — 배경·기술 결정은 [`prd.md`](./prd.md), 동작의 정본은 [`spec-fixed.md`](./spec-fixed.md)에 있다.
> 두 문서와 어긋나는 내용이 이 문서에 있다면 위 두 문서가 우선한다.

**분해 원칙 — 수직 슬라이싱**

- 계층별로 나누지 않는다. 각 이슈는 계층(컴포넌트 → 로컬 상태 → 렌더링)을 관통해 그 자체로 화면에서 확인 가능한 동작을 만든다.
- FILTER-1이 워킹 스켈레톤이다. ADR-1~3(인라인 파생 로직, `App.tsx` 상태 소유, `TagFilterBar` 신설)이 요구하는 구조를 함께 지고 간다.
- 범위는 PRD 4장(Out of Scope) — 다중 태그 조합/AND-OR, 태그 검색, URL 공유, 자동완성, 개수 표시, 정렬/그룹핑, 태그 관리(이름변경·삭제·색상) — 를 넘지 않는다.

## 이슈 목록

| ID       | 제목                                                         | 근거              | 선행     | GitHub 이슈                                                |
| -------- | ------------------------------------------------------------ | ----------------- | -------- | ---------------------------------------------------------- |
| FILTER-1 | 태그 칩을 클릭해 노트 목록을 좁혀본다                        | US-1 / FR-1,2,3   | —        | [#10](https://github.com/justin148077/ccwork-v2/issues/10) |
| FILTER-2 | 노트 카드에 태그를 표시한다                                  | US-2 / FR-4       | —        | [#11](https://github.com/justin148077/ccwork-v2/issues/11) |
| FILTER-3 | 필터링 중인 태그를 가진 노트가 모두 사라지면 전체로 돌아간다 | FR-6 (spec-fixed) | FILTER-1 | [#12](https://github.com/justin148077/ccwork-v2/issues/12) |

권장 순서: **FILTER-1 → (FILTER-2, FILTER-3 병렬)**

---

## FILTER-1. 태그 칩을 클릭해 노트 목록을 좁혀본다

노트 목록 위에 존재하는 모든 태그를 칩으로 나열하는 필터 바를 새로 만들고, 칩을 클릭하면 그 태그를 가진 노트만 목록에 남는 것까지가 이 이슈의 범위다. 이 이슈가 워킹 스켈레톤이므로 `TagFilterBar` 컴포넌트 신설(ADR-3), `App.tsx`에 `selectedTag` 로컬 상태 추가(ADR-2), `NoteList`가 인라인으로 필터링하는 구조(ADR-1)를 함께 만든다. 필터링 중인 태그를 가진 노트가 모두 사라졌을 때의 자동 리셋(FR-6)은 FILTER-3으로 미룬다 — 지금은 노트/태그가 그대로 있는 상태에서의 선택/해제 동작만 다룬다.

**영향 범위**

- `src/components/TagFilterBar.tsx` (신규)
  - `notes: Note[]`, `selectedTag: string | null`, `onSelectTag: (tag: string | null) => void` props
  - 고유 태그를 `[...new Set(notes.flatMap((n) => n.tags ?? []))].sort((a, b) => a.localeCompare(b))`로 인라인 계산(ADR-1)
  - 고유 태그가 하나도 없으면 `null`을 반환해 필터 바 자체를 렌더링하지 않음(FR-1)
  - `[전체]` 칩 + 태그 칩들을 렌더링. 칩 클릭 시 `onSelectTag(tag)` 호출, 단 이미 선택된 태그를 다시 클릭하면 `onSelectTag(null)` 호출(토글 해제)
  - 현재 `selectedTag`(또는 `[전체]`)에 활성 스타일 적용
- `src/components/NoteList.tsx`
  - `selectedTag: string | null` prop 추가
  - 렌더링 전 `notes.filter((n) => !selectedTag || n.tags?.includes(selectedTag))`로 인라인 필터링(ADR-1)
  - "노트 X개" 카운트 문구가 필터링된 배열의 길이를 반영
- `src/App.tsx`
  - `const [selectedTag, setSelectedTag] = useState<string | null>(null)` 추가(ADR-2)
  - `Layout`의 `sidebar` prop 안에 `<TagFilterBar notes={notes} selectedTag={selectedTag} onSelectTag={setSelectedTag} />`와 `<NoteList selectedTag={selectedTag} ... />`를 나란히 조립(ADR-3) — `notes`는 `useNotes()`로 조회

**의존 관계** — 없음. FILTER-2, FILTER-3의 선행(FILTER-3만 실제 의존, FILTER-2는 독립).

**완료조건 (Acceptance Criteria)**

**AC-1.1 태그가 있는 노트가 존재하면 필터 바에 `[전체]`와 고유 태그 칩이 가나다순으로 보인다**

- **Given** `tags: ['work']`, `tags: ['ideas']`, `tags: ['work']`인 노트 3개가 있고
- **When** 화면이 렌더링되면
- **Then** 필터 바에 `[전체]`, `ideas`, `work` 순서로 칩이 보인다(중복 제거, 가나다순)

**AC-1.2 어떤 노트에도 태그가 없으면 필터 바가 보이지 않는다**

- **Given** 모든 노트의 `tags`가 빈 배열이거나 없고
- **When** 화면이 렌더링되면
- **Then** 필터 바(태그 칩 목록) 자체가 DOM에 없다

**AC-1.3 태그 칩을 클릭하면 그 태그를 가진 노트만 목록에 남는다**

- **Given** `react` 태그가 붙은 노트 1개, `work` 태그가 붙은 노트 1개, 태그 없는 노트 1개가 있고
- **When** 필터 바에서 `react` 칩을 클릭하면
- **Then** 노트 목록에는 `react` 노트만 보이고 나머지 2개는 사라지며, "노트 1개" 문구로 갱신된다

**AC-1.4 이미 선택된 태그 칩을 다시 클릭하면 전체로 돌아간다**

- **Given** `react` 칩을 클릭해 필터링된 상태이고
- **When** `react` 칩을 한 번 더 클릭하면
- **Then** 노트 목록에 모든 노트가 다시 보이고 `[전체]` 칩이 활성 상태로 표시된다

**AC-1.5 `[전체]` 칩을 클릭하면 필터가 해제된다**

- **Given** `react` 태그로 필터링된 상태이고
- **When** `[전체]` 칩을 클릭하면
- **Then** 모든 노트가 다시 보인다

**테스트 계획**

- 컴포넌트(RTL, `TagFilterBar` 단독) — notes prop으로 칩 목록/정렬/숨김 렌더링 확인, 클릭 시 `onSelectTag`가 올바른 인자(태그명 또는 토글 시 `null`)로 호출되는지
- 컴포넌트(RTL, `NoteList` 단독) — `selectedTag` prop 값에 따라 필터링된 notes만 렌더링되는지, 카운트 문구가 갱신되는지
- 통합(RTL, `App`) — `TagFilterBar` 클릭이 실제로 `NoteList`에 반영되는 전체 흐름(AC-1.3~1.5) 확인
- 수동 — json-server를 띄운 상태에서 필터링 후 새로고침하면 `[전체]`로 초기화되는지(FR-5) 확인

---

## FILTER-2. 노트 카드에 태그를 표시한다

각 노트 카드(`NoteItem`)에 그 노트의 태그를 읽기 전용 칩으로 보여준다. 클릭 동작은 없다 — 필터 진입은 FILTER-1의 상단 바에서만 가능하다(spec-fixed FR-4). `TagFilterBar`/필터링 로직과 무관하게 독립적으로 완결되는 슬라이스라 FILTER-1과 병렬로 진행할 수 있다.

**영향 범위**

- `src/components/NoteItem.tsx`
  - `note.tags`를 읽기 전용 칩으로 렌더링(삭제 버튼 없음, 클릭 핸들러 없음)
  - `note.tags`가 없거나 빈 배열이면 태그 영역 자체를 렌더링하지 않음(ADR-5, `tags ?? []` 방어)
  - 시각 스타일은 `NoteEditor.tsx`의 기존 칩 클래스를 참고해 맞추되, 정확한 색상은 구현 시 `design-system` skill로 확정(ADR-5)

**의존 관계** — 없음. FILTER-1과 독립.

**완료조건 (Acceptance Criteria)**

**AC-2.1 노트 카드에 그 노트의 태그가 칩으로 보인다**

- **Given** `tags: ['react', 'work']`인 노트가 있고
- **When** 노트 목록이 렌더링되면
- **Then** 해당 카드에 `react`, `work` 칩이 보인다(저장된 배열 순서 그대로, 정렬하지 않음)

**AC-2.2 태그가 없는 노트의 카드에는 태그 영역이 보이지 않는다**

- **Given** `tags: []`인 노트와 `tags` 필드 자체가 없는(레거시) 노트가 있고
- **When** 노트 목록이 렌더링되면
- **Then** 두 카드 모두 태그 칩 영역이 DOM에 없고 콘솔 에러도 없다

**테스트 계획**

- 컴포넌트(RTL) — `tags`가 있는 노트를 렌더링해 칩 텍스트가 보이는지
- 컴포넌트 — `tags: []`, `tags: undefined` 노트를 각각 렌더링해도 throw하지 않고 칩 영역이 없는지
- 수동 — 실제 여러 노트에 태그를 붙인 뒤 목록 화면에서 한눈에 보이는지 확인

---

## FILTER-3. 필터링 중인 태그를 가진 노트가 모두 사라지면 전체로 돌아간다

FILTER-1의 `selectedTag`를 화면에 그대로 쓰지 않고, "지금 선택된 태그가 현재 고유 태그 목록에 여전히 있는지"를 매 렌더 파생시켜(`activeTag`) 필터 하이라이트와 목록 필터링에 사용하도록 바꾼다(ADR-4). `useEffect`로 state를 되돌리지 않는다.

**영향 범위**

- `src/App.tsx`
  - `notes`로부터 고유 태그 목록(`uniqueTags`)을 계산 — `TagFilterBar` 내부 계산과 같은 로직이 중복되지만 ADR-1이 인지하고 감수한 트레이드오프
  - `const activeTag = selectedTag && uniqueTags.includes(selectedTag) ? selectedTag : null` 파생
  - `TagFilterBar`/`NoteList`에 기존 `selectedTag` 대신 `activeTag`를 전달

**의존 관계** — FILTER-1 완료 후(선택 상태·컴포넌트 구조가 이미 있어야 함).

**완료조건 (Acceptance Criteria)**

**AC-3.1 필터링 중인 태그를 가진 마지막 노트를 삭제하면 필터가 자동으로 전체로 돌아간다**

- **Given** `react` 태그가 붙은 노트가 1개뿐이고 그 태그로 필터링 중이며
- **When** 그 노트를 삭제하면
- **Then** 노트 목록에 남은(태그 없는 포함) 모든 노트가 다시 보이고, 필터 바에서 `[전체]` 칩이 활성 상태로 표시되며 `react` 칩은 더 이상 존재하지 않는다

**AC-3.2 필터링 중인 태그가 다른 노트에도 남아있으면 자동 리셋되지 않는다**

- **Given** `react` 태그가 붙은 노트가 2개 있고 그 중 하나로 필터링 중이며
- **When** `react` 태그가 붙은 노트 중 1개를 삭제하면
- **Then** 여전히 `react`로 필터링된 상태가 유지되고, 남은 `react` 노트 1개만 보인다

**테스트 계획**

- 통합(RTL, `App`) — `NotesProvider` + mock API로 노트 삭제를 실제로 트리거해 AC-3.1/3.2 확인
- 수동 — 태그를 편집해 마지막 남은 태그를 떼어냈을 때도(삭제가 아니라 태그 제거 경로) 동일하게 리셋되는지 확인

---

## GitHub 등록

이슈 3개 모두 등록 완료(#10, #11, #12). 위 "이슈 목록" 표에서 링크 확인.

프로젝트 보드 등록은 `gh` 토큰에 `read:project`/`project` 스코프가 없어 실패했다:

```bash
gh project list --owner justin148077
# error: your authentication token is missing required scopes [read:project]
```

스코프를 추가한 뒤 아래 명령으로 보드에 올릴 수 있다(`PROJECT_NUMBER`는 실제 보드 번호로 교체):

```bash
gh auth refresh -s project -s read:project
gh project item-add <PROJECT_NUMBER> --owner justin148077 --url https://github.com/justin148077/ccwork-v2/issues/10
gh project item-add <PROJECT_NUMBER> --owner justin148077 --url https://github.com/justin148077/ccwork-v2/issues/11
gh project item-add <PROJECT_NUMBER> --owner justin148077 --url https://github.com/justin148077/ccwork-v2/issues/12
```
