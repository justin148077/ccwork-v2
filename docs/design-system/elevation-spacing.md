# Elevation, Depth & Spacing

[← 인덱스](README.md)

## Tonal Layering

일반 카드에 그림자부터 쓰지 않는다. `surface_container_lowest`(흰 카드)를 `surface_container`(`#eaeff1`) 섹션 위에 얹는 방식으로 "부드러운 들림"을 만든다. 종이가 겹쳐진 것처럼 보이는 게 목표.

## Ambient Shadow

띄워야 하는 요소(예: "새 글" 팝오버)에만 사용:

- Blur: `24px`–`40px`
- Opacity: `on_surface`(`#2b3437`)의 6%
- Accent 색을 살짝 섞어 톤을 통일

예시(Tailwind 임의값): `shadow-[0_24px_40px_rgba(43,52,55,0.06)]`

> 기본 Tailwind shadow 프리셋(`shadow-sm`/`md`/`lg`/`xl`/`2xl`)은 [do-dont.md](do-dont.md)에 따라 금지되며, `.claude/hooks/design-system-lint.mjs`가 신규/수정 코드에서 이를 자동 차단한다.

## Ghost Border (대체 수단)

비슷한 배경끼리 맞닿아 접근성상 경계가 필요한 경우에만:

- `outline_variant`(`#abb3b7`) **15% 불투명도**
- 경계선이 아니라 "경계의 암시" 정도여야 한다 — 예: `border border-[#abb3b7]/15`

## Spacing

기본 리듬 단위는 `0.35rem`이며, `spacing.N = N × 0.35rem`으로 계산한다.

| 토큰         | 값        | 용도                                      |
| ------------ | --------- | ----------------------------------------- |
| `spacing.1`  | `0.35rem` | 라벨 ↔ 인풋 간격                          |
| `spacing.2`  | `0.7rem`  | 헤드라인 ↔ 본문 간격                      |
| `spacing.4`  | `1.4rem`  | 카드/리스트 아이템 사이 간격(구분선 대신) |
| `spacing.10` | `3.5rem`  | 섹션 블록 사이 간격                       |

Tailwind에서는 임의값 클래스(`gap-[1.4rem]`, `space-y-[1.4rem]`)로 표현한다 — 이 프로젝트는 이미 `shadow-[...]` 같은 임의값 패턴을 쓰고 있어 일관된 방식이다.
