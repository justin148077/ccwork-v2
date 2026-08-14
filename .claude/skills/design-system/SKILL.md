---
name: design-system
description: 이 프로젝트(React 19 + TypeScript notes 앱, Tailwind CSS v4)에서 컴포넌트를 새로 만들거나 기존 스타일을 수정할 때, docs/design-system/의 "The Digital Atelier" 디자인 시스템 문서 중 지금 작업에 맞는 파일만 골라 참고하도록 라우팅한다. 사용자가 "컴포넌트 스타일링해줘", "이 UI 만들어줘/디자인해줘", "색상 정해줘", "버튼/카드/칩/인풋 만들어줘", "타이포그래피 적용해줘", "간격/여백 조정해줘", "이 화면 디자인 시스템대로 고쳐줘" 처럼 말하거나, className에 색상/그림자/보더/간격 값을 새로 넣어야 할 때 사용한다. 색상 hex나 Tailwind 임의값을 감으로 짓지 말고 반드시 이 스킬을 통해 docs/design-system/의 토큰과 규칙을 먼저 확인할 것.
---

# design-system

`docs/design-system/`에 있는 "The Digital Atelier" 디자인 시스템 문서로 라우팅하는 스킬. 목적은 스타일 작업마다 문서 전체를 매번 컨텍스트에 올리지 않고, 지금 하려는 작업에 맞는 파일만 정확히 읽게 하는 것이다.

## 절차

1. 지금 하려는 스타일 작업의 종류를 판단한다.
2. 아래 표에서 해당하는 파일(들)만 Read로 연다. 관련 없는 파일은 열지 않는다.
3. 문서의 토큰/규칙을 그대로 적용한다 — 임의의 색상 hex나 Tailwind 프리셋을 감으로 쓰지 않는다.
4. 작업이 여러 종류에 걸치면(예: 새 컴포넌트를 만들면서 색+간격+컴포넌트 패턴이 동시에 필요) 해당하는 파일을 모두 연다.
5. 기존 컴포넌트(`NoteItem`, `Layout` 등)를 수정하는 경우 [`docs/design-system/gaps.md`](../../../docs/design-system/gaps.md)를 먼저 확인한다 — 이미 알려진 격차(예: `border-border` 남용)라면 손대는 김에 목표 상태로 맞출지 판단한다.

## 작업 종류 → 문서 매핑

| 하려는 작업                                                                 | 열어야 할 파일                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 배경/텍스트/보더 색상을 정하거나 바꿀 때                                    | [`docs/design-system/colors.md`](../../../docs/design-system/colors.md)                       |
| 제목/본문/라벨 등 텍스트 스타일(크기, 자간, 대소문자)을 정할 때             | [`docs/design-system/typography.md`](../../../docs/design-system/typography.md)               |
| 그림자, 카드 "들림" 효과, 여백/간격 값을 정할 때                            | [`docs/design-system/elevation-spacing.md`](../../../docs/design-system/elevation-spacing.md) |
| 버튼/카드/리스트/인풋/태그 칩(Knowledge Token) 등 구체적 컴포넌트를 만들 때 | [`docs/design-system/components.md`](../../../docs/design-system/components.md)               |
| 스타일이 이 시스템에 맞는지 최종 점검할 때                                  | [`docs/design-system/do-dont.md`](../../../docs/design-system/do-dont.md)                     |
| 기존 컴포넌트를 손댈 때 이미 알려진 격차인지 확인할 때                      | [`docs/design-system/gaps.md`](../../../docs/design-system/gaps.md)                           |

전체 개요나 처음 시작할 위치가 필요하면 [`docs/design-system/README.md`](../../../docs/design-system/README.md)를 연다.

## 참고: 자동 검사되는 규칙

`do-dont.md`에 정리된 규칙 중 세 가지(순수 검정 금지, 기본 Tailwind shadow 프리셋 금지, `border-border` 신규 사용 금지)는 `.claude/hooks/design-system-lint.mjs`가 PreToolUse hook으로 `.tsx`/`.css`의 신규·수정 코드에 대해 이미 자동 차단한다. 이 스킬로 미리 규칙을 따르면 hook에 걸릴 일이 없다 — hook은 최종 안전망이지 1차 참고 수단이 아니다.

## 하지 않을 것

- 문서에 없는 색상 hex나 간격 값을 새로 만들지 않는다 — 없으면 [colors.md](../../../docs/design-system/colors.md)/[elevation-spacing.md](../../../docs/design-system/elevation-spacing.md)의 기존 토큰으로 가장 가까운 것을 고르거나, 사용자에게 신규 토큰 추가 여부를 확인한다.
- 폰트를 Inter로 바꾸지 않는다 — 이 프로젝트는 Pretendard/Boogaloo를 유지하기로 결정했다 (`typography.md` 참고).
- 관련 없는 작업에서 디자인 시스템 문서 전체를 한 번에 읽지 않는다 — 위 매핑표대로 필요한 파일만 연다.
