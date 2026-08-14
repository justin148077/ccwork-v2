# Typography

[← 인덱스](README.md)

브리프는 **Inter 전용**을 명시하지만, 이 프로젝트는 이미 `--font-sans: 'Pretendard Variable'`(본문)과 `Boogaloo`(`Layout.tsx` 헤더 로고 전용, `CLAUDE.md`에 의도적 예외로 기록됨)를 쓰고 있다. **폰트 자체는 교체하지 않고**, 브리프의 스케일·굵기·자간 위계 규칙만 기존 폰트 스택에 적용한다.

| 레벨                    | 크기      | 세부 규칙                                      | 이 프로젝트에서의 용도                                                                             |
| ----------------------- | --------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Display (The Statement) | `3.5rem`  | 자간 `-0.02em`, `font-display`(Boogaloo)       | 랜딩/브랜드 모먼트 전용 — 현재 헤더 로고(`text-2xl`)는 이보다 작은 스케일로, 확대는 별도 결정 필요 |
| Headline (The Insight)  | `1.75rem` | `line-height: 1.4`                             | 노트 상세/편집 제목 (`NoteEditor` 제목 입력)                                                       |
| Body (The Knowledge)    | `1rem`    | 본문은 `muted-foreground`, 강조는 `foreground` | 노트 본문 (`NoteEditor` 내용, `NoteItem` 미리보기)                                                 |
| Label (The Metadata)    | `0.75rem` | `uppercase`, 자간 `+0.05em`                    | 메타데이터 라벨                                                                                    |

현재 코드의 `text-xs font-semibold tracking-widest uppercase text-muted-foreground` 패턴(`NoteList.tsx:32`의 "노트 N개", `NoteEditor.tsx:67`의 "새 노트"/"노트 편집")은 **이미 Label 규칙과 정확히 일치**한다 — 앞으로도 이 패턴을 재사용할 것.
