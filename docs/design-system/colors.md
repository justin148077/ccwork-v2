# Colors

[← 인덱스](README.md)

## No-Line Rule

**섹션을 구분할 때 1px solid border를 쓰지 않는다.** 경계는 배경색 단계 차이로만 표현한다. 예: 사이드바(`surface_container_low`)가 배경(`surface`)에 바로 맞닿되, 경계는 "보이지" 않고 "느껴져야" 한다.

## Surface Hierarchy

UI를 쌓아 올린 물리적 재질처럼 다룬다. 층을 낮은 것부터 높은 것 순으로 나열하면:

| 레이어    | 브리프 토큰                 | Hex       | 용도                                                |
| --------- | --------------------------- | --------- | --------------------------------------------------- |
| Base      | `surface` / `background`    | `#f8f9fa` | 기본 캔버스                                         |
| Secondary | `surface_container_low`     | `#f1f4f6` | 사이드바, 내비게이션 배경                           |
| Mid       | `surface_container`         | `#eaeff1` | 리프트 카드가 놓이는 하단 섹션                      |
| High      | `surface_container_high`    | `#e2e9ec` | 보조 버튼 배경                                      |
| Highest   | `surface_container_highest` | `#dbe4e7` | 선택 상태, 칩(Knowledge Token) 배경                 |
| Lowest    | `surface_container_lowest`  | `#ffffff` | 최우선 카드, 편집 중인 작업 영역 ("들린" 종이 느낌) |

## Glass & Gradient Rule

- **떠 있는 요소** (모달, 드롭다운, 호버 브레드크럼): `surface`(`#f8f9fa`) 80% 불투명도 + `backdrop-filter: blur(12px)`.
- **주요 액션(CTA)**: `tertiary`(`#0053dc`) → `tertiary_container`(`#3e76fe`) 선형 그라디언트. 단일 accent 컬러에 보석 같은 깊이를 더해 UI가 납작해 보이지 않게 한다.

## 토큰 매핑 (브리프 → `src/index.css` `--color-*`)

아래는 브리프의 Material 스타일 네이밍을 이 프로젝트의 기존 네이밍 관례로 옮긴 표다. **"제안"** 표시는 아직 `src/index.css`에 없는 신규 토큰(별도 작업에서 추가 필요) — 현황은 [gaps.md](gaps.md) 참고.

| 브리프 토큰                 | Hex       | 프로젝트 CSS 변수                  | 상태                                                        |
| --------------------------- | --------- | ---------------------------------- | ----------------------------------------------------------- |
| `surface` / `background`    | `#f8f9fa` | `--color-background`               | 기존 값(`hsl(0 0% 94%)`)에서 변경 필요                      |
| `surface_container_lowest`  | `#ffffff` | `--color-card`                     | 이미 동일 (`hsl(0 0% 100%)`) — 그대로 재사용                |
| `surface_container_low`     | `#f1f4f6` | `--color-surface-low` (제안)       | 신규 — 현재 `Layout.tsx`의 `bg-muted/50` 사이드바가 이 역할 |
| `surface_container`         | `#eaeff1` | `--color-surface` (제안)           | 신규                                                        |
| `surface_container_high`    | `#e2e9ec` | `--color-surface-high` (제안)      | 신규 — 보조 버튼 배경                                       |
| `surface_container_highest` | `#dbe4e7` | `--color-surface-highest` (제안)   | 신규 — 칩/선택 상태                                         |
| `on_surface`                | `#2b3437` | `--color-foreground`               | 기존 값(`hsl(220 35% 14%)`)에서 변경 필요                   |
| `on_surface_variant`        | `#586064` | `--color-muted-foreground`         | 기존 값(`hsl(0 0% 42%)`)에서 변경 필요                      |
| `tertiary`                  | `#0053dc` | `--color-accent` (제안)            | 신규 — CTA/강조 색                                          |
| `tertiary_container`        | `#3e76fe` | `--color-accent-light` (제안)      | 신규 — 그라디언트 종료색                                    |
| `on_tertiary`               | `#faf8ff` | `--color-accent-foreground` (제안) | 신규                                                        |
| `outline_variant`           | `#abb3b7` | `--color-outline-variant` (제안)   | 신규 — Ghost Border 전용, 15% 불투명도로만 사용             |

- `--color-destructive`(`hsl(0 84% 60%)`)는 브리프에 대응 토큰이 없으므로 **그대로 유지**한다. 삭제/에러 액션에는 계속 `destructive`를 쓰고, `accent`(파란색)를 쓰지 않는다.
- `--color-muted`(`hsl(0 0% 90%)`)는 개념적으로 `surface_container_low`와 겹친다. 신규 토큰이 추가되면 `muted` 사용처를 `surface-low`로 점진 이관한다.

## 관련 문서

- 순수 검정 금지, `border-border` 금지 등 강제 규칙은 [do-dont.md](do-dont.md)에 있고, 이 중 일부는 `.claude/hooks/design-system-lint.mjs` PreToolUse hook으로 기계적으로 검사된다.
