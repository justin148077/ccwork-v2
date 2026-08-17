# Components

[← 인덱스](README.md)

## Buttons

- **Primary**: `tertiary` → `tertiary_container` 그라디언트 배경, `on_tertiary` 텍스트, 라운드 `md`(`0.375rem`, 버튼 전용 — 카드 등 다른 요소의 기존 라운드값(`rounded-xl`/`2xl`/`3xl`)은 그대로 유지).
- **Secondary**: `surface_container_high` 배경 + `on_surface` 텍스트, 보더 없음.
- **Tertiary(Ghost)**: 배경 없음, `tertiary` 색 텍스트, 호버 시 accent 2% 불투명도 배경.

> 파괴적 액션(삭제 등)은 accent가 아니라 계속 `destructive` 토큰을 쓴다 — 브리프 팔레트에 없는 별도 의미 색.

## Cards & Lists

- **Divider Prohibition**: 리스트 아이템 사이에 구분선을 쓰지 않는다. 대신 **간격**([`spacing.4` = `1.4rem`](elevation-spacing.md))으로 구분한다.
- **Hover State**: 배경을 `surface` → `surface_container_low`로 전환한다.

## Input Fields

- 배경 `surface_container_lowest`(흰색) + 1px Ghost Border, 포커스 시에만 1px `tertiary` 보더로 전환.
- 라벨은 항상 인풋 위, `label-md` 스타일, `spacing.1` 간격.

## Knowledge Token (커스텀 칩)

주제 태깅(`#javascript`, `#design` 등)에 사용하는 컴포넌트. **[`docs/features/tag/spec-fixed.md`](../features/tag/spec-fixed.md)에서 정의한 태그 칩 UI가 바로 이 컴포넌트다** — 태그 기능 구현 시 아래 스펙을 따른다.

- 배경 `surface_container_highest`(`#dbe4e7`)
- 텍스트 `on_surface_variant`(`#586064`)
- `rounded-full`, 보더 없음
