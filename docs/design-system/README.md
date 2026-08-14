# Design System — The Digital Atelier

Stitch에서 받은 노트 앱 디자인 브리프("The Digital Atelier")를 이 프로젝트(React 19 + Tailwind CSS v4, `src/index.css`)에 맞게 번역한 문서다.

**이 문서 세트는 이후 모든 스타일 작업(컴포넌트 신규 작성, 기존 컴포넌트 수정)의 참조 기준이다.** Tailwind 유틸리티 클래스를 쓸 때 임의의 색상/간격 값을 새로 만들지 말고, 아래 토큰과 규칙을 우선 사용한다.

> **스타일 작업을 시작하기 전, 매번 이 문서를 직접 열어보는 대신 `design-system` Skill을 쓸 것.** 스킬이 지금 하려는 작업(색상/타이포그래피/elevation·간격/컴포넌트)에 맞는 파일만 골라 참고하도록 라우팅해준다 (`.claude/skills/design-system/SKILL.md`). Do/Don't 중 기계적으로 판별 가능한 규칙 일부는 `.claude/hooks/design-system-lint.mjs`(PreToolUse hook)가 `.tsx`/`.css` 파일의 신규·수정 코드에 대해 자동으로 검사·차단한다.

이 문서는 **목표 상태(target)**를 정의한다. 현재 코드가 아직 이 규칙을 완전히 따르지 않는 부분은 [gaps.md](gaps.md)에 정리했다.

## Creative North Star: The Curated Archive

이 노트 앱은 일반적인 "지식 베이스" 템플릿이 아니라, 고급 디지털 아틀리에의 철학을 따른다. 각 노트를 데이터가 아니라 개인 박물관에 놓인 소장품처럼 다룬다. 핵심 원칙 두 가지:

- **Intentional Asymmetry & Tonal Depth** — 콘텐츠를 딱딱한 테두리 상자에 가두지 않는다.
- **The Curated Archive** — 콘텐츠는 배경 위에 "떠 있는" 느낌을 주고, UI가 콘텐츠보다 도드라지지 않는다.

## 문서 구성

| 파일                                         | 내용                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [colors.md](colors.md)                       | No-Line Rule, Surface Hierarchy, Glass & Gradient Rule, 브리프 → 프로젝트 `--color-*` 토큰 매핑 |
| [typography.md](typography.md)               | Display/Headline/Body/Label 스케일, 폰트(Inter 미채택) 결정                                     |
| [elevation-spacing.md](elevation-spacing.md) | Tonal Layering, Ambient Shadow, Ghost Border, Spacing 리듬 스케일                               |
| [components.md](components.md)               | Buttons, Cards & Lists, Input Fields, Knowledge Token(태그 칩)                                  |
| [do-dont.md](do-dont.md)                     | 필수 Do/Don't 목록 + hook으로 자동 검사되는 규칙                                                |
| [gaps.md](gaps.md)                           | 현재 코드가 아직 이 시스템을 따르지 않는 지점 체크리스트                                        |
