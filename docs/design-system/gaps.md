# 현재 코드와의 격차 (Known Gaps)

[← 인덱스](README.md)

이 디자인 시스템 문서는 목표 상태다. 아래는 현재 코드가 아직 규칙을 따르지 않는 지점 — 실제 토큰 적용/리팩터링은 별도 작업으로 진행한다. 새로 작업할 때 이 표를 체크리스트로 참고할 것.

| 규칙                                     | 현재 상태                                                            | 위치                           |
| ---------------------------------------- | -------------------------------------------------------------------- | ------------------------------ |
| 신규 컬러 토큰(`accent`, `surface-*` 등) | `src/index.css`에 미정의 ([colors.md](colors.md) 매핑표 참고)        | `src/index.css`                |
| No-Line Rule                             | `border`/`border-border`를 카드·헤더·사이드바 경계에 사용 중         | `NoteItem.tsx`, `Layout.tsx`   |
| Divider Prohibition                      | 구분선은 없지만 카드 자체가 보더로 감싸져 있음                       | `NoteItem.tsx`                 |
| Primary 버튼 그라디언트                  | `bg-foreground`(단색, 흑백 톤) 사용 중, accent 그라디언트 미적용     | `Layout.tsx`, `NoteEditor.tsx` |
| Input Fields 보더 규칙                   | 제목/본문 입력창이 `border-none`(테두리 없음)으로 완전히 다른 스타일 | `NoteEditor.tsx`               |
| Glassmorphism                            | 모달/드롭다운 자체가 아직 없음                                       | —                              |

`.claude/hooks/design-system-lint.mjs` PreToolUse hook은 **새로 작성/수정되는 코드**만 검사한다 — 위 표의 기존 위반은 해당 라인을 직접 편집하지 않는 한 자동으로 걸리지 않는다. 이 파일을 만지는 리팩터링 작업을 할 때 함께 정리하는 것을 권장한다.
