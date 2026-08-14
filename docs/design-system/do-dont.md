# Do's and Don'ts

[← 인덱스](README.md)

## Do

- **DO** 여백을 구조적 요소로 사용한다. 애매하면 마진을 늘린다.
- **DO** 사이드바의 "선택됨" 상태에 `surface_container_highest`를 쓴다.
- **DO** accent(`tertiary`) 색은 의도가 분명한 액션에만 아껴 쓴다.
- **DO** 리스트/카드 구분은 보더가 아니라 간격(spacing)으로 표현한다.

## Don't

- **DON'T** 순수 검정(`#000000`)을 텍스트에 쓰지 않는다 — `on_surface`(`#2b3437`)를 쓴다.
- **DON'T** 기본 그림자(`shadow`, `shadow-md` 등 미조정 프리셋)를 쓰지 않는다 — "설계된" 느낌이 아니라 "기본값" 느낌이 난다.
- **DON'T** 기능적으로 명확한 목적이 없으면 아이콘을 쓰지 않는다 — 이 시스템은 타이포그래피 중심이다.
- **DON'T** 섹션 구분에 보더를 쓰지 않는다 — 색상 단계 차이로 표현한다.
- **DON'T** (이 프로젝트 한정) `border-border`로 카드/헤더/사이드바 경계를 긋지 않는다 — 현재 `NoteItem.tsx`, `Layout.tsx`가 이 패턴을 쓰고 있으며 No-Line Rule 위반이다. 새 컴포넌트에서 반복하지 말 것.

## 자동 검사되는 규칙

아래 세 가지는 `.claude/skills/design-system/SKILL.md` + `.claude/hooks/design-system-lint.mjs` (PreToolUse hook)로 **새로 작성/수정되는 `.tsx`/`.css` 코드에 한해** 기계적으로 검사·차단된다. 기존 코드(예: `NoteItem.tsx`의 기존 `border-border`)는 해당 라인을 직접 건드리지 않는 한 걸리지 않는다 — [gaps.md](gaps.md) 참고.

| 검사                           | 패턴                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| 순수 검정 금지                 | `text-black`/`bg-black`/`border-black`, `#000000`, `#000`    |
| 기본 shadow 프리셋 금지        | `shadow-sm`/`shadow-md`/`shadow-lg`/`shadow-xl`/`shadow-2xl` |
| `border-border` 신규 사용 금지 | `border-border`                                              |

나머지 Do/Don't(여백, accent 절제 사용, 아이콘 최소화 등)는 의미 판단이 필요해 hook으로 검사하지 않는다 — 스킬을 통해 작업할 때 사람이 직접 준수한다.
