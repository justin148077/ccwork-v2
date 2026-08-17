---
name: tdd-auto-loop
description: GitHub 이슈 번호 하나를 받아 `test-scenarios → tdd-red → tdd-green → ac-verifier → tdd-refactor → security-review → create-pr` 7단계를 사람 승인 없이 끝까지 완주하는 완전 자율 루프 스킬. `tdd-loop`와 달리 각 단계를 별도 subagent로 격리 실행하며(메인은 코드 본문을 직접 보지 않는다), 하위 스킬/에이전트 내부의 사용자 승인 게이트는 subagent가 스스로 통과시키고 정해진 JSON 스키마 한 블록으로만 결과를 보고한다. 사용자가 "/tdd-auto-loop 10"처럼 이슈 번호를 주거나, "이 이슈 자동으로 끝까지 돌려줘", "승인 없이 전체 사이클 진행해줘", "완전 자동으로 PR까지 만들어줘"처럼 말할 때 사용한다. 모호한 지점에서는 절대 추측하지 않고 즉시 STOP하며, STOP 시 사람에게 묻지 않고 이슈에 코멘트를 남긴 뒤 루프를 종료한다 — `tdd-loop`(단계마다 사람 승인 대기)와는 별도의, 무인 실행을 위한 스킬이다.
---

# tdd-auto-loop

`CLAUDE.md`의 "Workflow: TDD 이슈 사이클" 7단계를 이슈 번호 하나로 시작해 **사람 개입 없이** 끝까지 완주하는 컨테이너 스킬이다. `tdd-loop`가 각 하위 스킬의 승인 게이트를 그대로 사람에게 넘기는 반면, 이 스킬은 각 단계를 격리된 subagent로 spawn해서 그 승인 게이트를 subagent 자신이 통과시키게 하고, 결과를 정해진 JSON으로만 돌려받는다. 메인 세션은 코드 본문을 직접 읽지 않는다 — 오직 subagent가 반환한 JSON만 보고 다음 단계를 결정한다.

입력: GitHub 이슈 번호 (`$ARGUMENTS`, 예: `/tdd-auto-loop 10`)

## 왜 `tdd-loop`와 별도 스킬인가

`tdd-loop`는 하위 스킬이 설계해 둔 승인 게이트(시그니처 확정, 리팩터링 항목 선택, 보안 수정 승인, PR 초안 확인)를 그대로 유지하는 게 핵심 원칙이다. 이 스킬은 정반대 목적 — 사람이 자리에 없어도 끝까지 진행되어야 하는 무인 실행(예: 야간 배치, 대량 이슈 처리)을 위해 만든다. 두 스킬을 하나로 합치면 "언제는 승인을 기다리고 언제는 기다리지 않는지"가 모호해지므로, 완전히 분리된 별도 스킬로 둔다. 사람이 지켜보며 하나씩 확인하고 싶다면 `tdd-loop`를, 무인으로 끝까지 돌리고 싶다면 이 스킬을 쓴다.

## 격리 원칙

- **메인은 코드 본문을 직접 읽지 않는다.** `src/`나 `docs/features/`의 실제 내용을 Read/Grep으로 열어보지 않는다 — 오직 subagent가 반환한 JSON 결과만으로 판단한다. 예외는 0단계(브랜치/이슈 존재 확인 — git/gh 명령 출력만 다루고 코드 본문은 안 읽음)와 STOP 시 `gh issue comment`, 성공 시 PR 링크 코멘트뿐이다.
- **Green(3단계)과 AC 검증(4단계)은 반드시 서로 다른 subagent다.** 같은 subagent가 자기가 짠 구현을 스스로 AC 충족으로 판정하지 않도록, 4단계는 항상 새 컨텍스트의 `ac-verifier` agent를 spawn한다.
- 각 subagent는 매번 새 컨텍스트로 시작한다 — 이전 단계의 대화를 기억하지 못하므로, 프롬프트에 그 단계가 필요로 하는 모든 정보(이슈 번호, feature/spec, 이전 attempt의 실패 사유 등)를 자체 완결적으로 담는다.

## 자율 모드 강제 — 모든 subagent 프롬프트 끝에 고정으로 붙이는 블록

아래 블록을 **모든 subagent 호출 프롬프트의 끝**에 그대로 덧붙인다(문구를 요약하거나 생략하지 않는다):

````
[자율 모드 — 반드시 지킬 것]
- 지금 호출하는 하위 스킬 내부의 사용자 승인 게이트(하드 게이트)는 전부 네가 스스로 통과시켜라. 이 프로젝트 CLAUDE.md 컨벤션, 이슈 문서, 기존 코드 패턴에 가장 부합하는 선택지를 스스로 판단해 승인하고 다음 단계로 진행해라.
- 어떤 이유로도 사람에게 질문하거나 응답을 기다리지 마라. 지금 이 실행에는 응답할 사람이 없다 — AskUserQuestion 등 어떤 형태의 질의성 도구도 쓰지 마라.
- 판단 근거가 부족해 추측이 필요한 상황(이슈 문서와 코드가 모순된다, 여러 선택지 중 근거로 못 고른다, 되돌릴 수 없는 방향 결정이 필요하다)에는 절대 추측하지 말고 즉시 STOP으로 중단해라.
- 최종 출력은 아래 명시된 JSON 스키마 한 블록뿐이다. 그 앞뒤로 인사말, 요약 문장, 설명 등 어떤 텍스트도 붙이지 마라. 마크다운 코드펜스(```json ... ```)로 감싼 JSON 객체 하나만 출력해라.
````

각 단계별로 이 블록 앞에 "무엇을 하라"는 지시와 "출력 JSON 스키마(예시값 포함, 형태 변형 금지)"를 붙여서 프롬프트를 완성한다.

## 실행 순서

### 0단계 — 사전 점검 (메인이 직접 수행, subagent 아님)

`tdd-loop` 0단계와 동일한 목적이지만, 사람에게 묻는 대신 애매하면 즉시 STOP한다.

1. `gh issue view $ARGUMENTS` — 이슈 존재 확인 + 본문에 AC(완료조건) 절이 있는지 확인. 없으면 STOP("AC 없음").
2. `git status --porcelain` — 비어있지 않으면 STOP("커밋되지 않은 변경 존재"). 자동 stash하지 않는다.
3. `docs/features/*/issues.md`에서 이슈 제목/번호로 매칭되는 `<spec>` 판별. 매칭 없으면 STOP("feature spec 판별 불가").
4. `feature/<spec>` 브랜치를 로컬+원격에서 탐색. 정확히 하나가 아니면(0개 또는 여러 개) STOP("base 브랜치 후보 불명확").
5. 현재 브랜치가 `feature/<spec>`가 아니면 그 브랜치로 checkout.
6. `feat/<이슈번호>-<slug>` 브랜치명을 정한다. 이미 로컬/원격에 존재하면 STOP("이슈 브랜치 이미 존재 — 이어쓸지 덮어쓸지는 사람 판단 필요") — 자동으로 이어쓰거나 덮어쓰지 않는다.
7. 존재하지 않으면 base에서 새로 분기해 checkout.

0단계 STOP은 아직 아무 subagent도 spawn하지 않은 상태이므로 "STOP 처리" 절의 gh 코멘트만 남기고 종료한다.

### 1단계 — `scenarios` (test-scenarios 자율 실행)

subagent(`general-purpose`)를 spawn한다. 프롬프트: "`Skill` 도구로 `test-scenarios`를 이슈 `$ARGUMENTS`에 대해 실행해라. 1단계(시그니처)와 2단계(시나리오) 승인 게이트를 모두 자율 모드 원칙에 따라 스스로 통과시키고 `docs/features/<spec>/issue-<번호>.md`까지 저장해라." + 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "scenarios",
  "status": "OK",
  "issue": 10,
  "feature": "tag",
  "doc_path": "docs/features/tag/issue-10.md",
  "scenario_count": 4,
  "reason": null
}
```

`status: "STOP"`이면 `reason`에 사유(예: "AC-2와 기존 updateNote 시그니처가 모순됨").

### 2단계 — `red` (tdd-red 자율 실행)

subagent(`general-purpose`) spawn. 프롬프트: "`Skill` 도구로 `tdd-red`를 이슈 `$ARGUMENTS`에 대해 실행해라. 승인 게이트 없는 스킬이므로 시나리오를 전부 실패 테스트로 옮기고 `npm test`로 회귀 없음까지 확인해라." + 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "red",
  "status": "OK",
  "issue": 10,
  "test_files": ["src/components/TagFilterBar.test.tsx"],
  "red_count": 4,
  "reason": null
}
```

### 3단계 — `green` (tdd-green 자율 실행, 최대 3회 attempt)

subagent(`general-purpose`) spawn. 프롬프트: "`Skill` 도구로 `tdd-green`을 이슈 `$ARGUMENTS`에 대해 실행해라." + (재시도인 경우) "이전 attempt는 다음 이유로 실패했다: `<이전 reason>`. 같은 접근을 반복하지 마라." + 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "green",
  "status": "OK",
  "issue": 10,
  "attempt": 1,
  "green_count": 4,
  "stub_files": [],
  "reason": null
}
```

**재시도 규칙**: `status: "STOP"`이거나 스키마 위반이면 `attempt`를 올려 최대 **3회**까지 새 subagent로 재시도한다. 3회 모두 실패하면 그 자리에서 STOP — 4단계로 진행하지 않는다.

### 4단계 — `ac_verify` (ac-verifier agent, Green과 반드시 분리된 subagent)

`Agent` 도구로 `subagent_type: ac-verifier`를 spawn한다 (3단계와 별개 컨텍스트). 프롬프트: "이슈 `$ARGUMENTS`의 AC 충족 여부를 독립 검증해라." + 아래 출력 형식 오버라이드 + 자율 모드 블록(질의 금지 부분만 해당 — ac-verifier는 원래도 읽기 전용 검증이라 승인 게이트 자체가 없음).

**출력 스키마**:

```json
{
  "step": "ac_verify",
  "status": "OK",
  "issue": 10,
  "ac_results": [{ "id": "AC-1", "verdict": "pass", "note": "TagFilterBar.test.tsx:12에서 검증" }],
  "ac_passed": true,
  "reason": null
}
```

`verdict`는 `pass|partial|fail` 중 하나. 하나라도 `pass`가 아니면 `status: "STOP"`, `ac_passed: false`, `reason`에 어떤 AC가 왜 미충족인지 요약. **재시도 없음** — AC 미충족은 스키마 위반이 아니라 정당한 STOP이므로 바로 종료한다.

### 5단계 — `refactor` (tdd-refactor 자율 실행)

subagent(`general-purpose`) spawn. 프롬프트: "`Skill` 도구로 `tdd-refactor`를 이슈 `$ARGUMENTS`에 대해 실행해라. 목록 제시 후 승인 대기 게이트는, 발견한 항목을 전부 자율 판단으로 승인해 순서대로 적용해라(각 항목 적용 후 테스트 실패 시 스킬 자체 규칙대로 롤백·스킵)." + 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "refactor",
  "status": "OK",
  "issue": 10,
  "applied": ["src/components/TagFilterBar.tsx: 중복 필터 로직 제거"],
  "skipped": [],
  "reason": null
}
```

"리팩터링할 게 없습니다"도 `applied: []`로 OK 취급. 시작 시점에 전체 테스트가 통과 상태가 아니면(Green이 실제로 안 끝난 경우) STOP.

### 6단계 — `security` (security-review 자율 실행)

subagent(`general-purpose`) spawn. 프롬프트: "`Skill` 도구로 `security-review`를 이슈 `$ARGUMENTS`에 대해 실행해라. '즉시 수정 필요' 항목은 스킬 규칙대로 전부 승인해 처리하고 재스캔까지 마쳐라. '권장 수정'/'무시 가능' 항목은 손대지 마라." + 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "security",
  "status": "OK",
  "issue": 10,
  "immediate_fixed": [],
  "recommended_remaining": [],
  "reason": null
}
```

재스캔 후에도 "즉시 수정 필요"가 남아있으면(예: `npm audit fix`(non-force)로 해결 안 되는 high/critical) `status: "STOP"`, `reason`에 남은 항목.

### 7단계 — `pr` (commitlint 검증 + create-pr 자율 실행 + 이슈 코멘트)

subagent(`general-purpose`) spawn. 프롬프트:

1. "`npx commitlint --from feature/<spec> --to HEAD`로 이번 이슈 작업 커밋들을 검증해라. 실패하면 STOP으로 보고해라(커밋 메시지를 임의로 rewrite하지 마라)."
2. "`Skill` 도구로 `create-pr`을 베이스 브랜치 `feature/<spec>`로 명시해서 실행해라. PR 본문에 `Closes #$ARGUMENTS`가 반드시 포함되게 해라 — 초안 승인 게이트는 자율 모드 원칙에 따라 스스로 승인해라. E2E 실패 시 스킬 자체 규칙대로 STOP해라."
3. "PR이 실제로 생성되면 URL을 결과에 포함해라."

- 자율 모드 블록.

**출력 스키마**:

```json
{
  "step": "pr",
  "status": "OK",
  "issue": 10,
  "pr_url": "https://github.com/org/repo/pull/42",
  "reason": null
}
```

7단계 성공 시 메인이 직접 `gh issue comment $ARGUMENTS --body "PR: <pr_url>"`을 실행한다 (별도 승인 없음 — PR 생성 승인에 포함된 마무리 동작).

## 재시도 규칙

- **3단계(Green)만 최대 3회**: task 실패(status STOP)와 스키마 위반을 합쳐 3 attempt까지 새 subagent로 재시도. 3회 소진 시 STOP.
- **그 외 모든 단계(0, 1, 2, 4, 5, 6, 7)는 스키마 위반 시에만 1회 재시도**: subagent 출력이 JSON 파싱 실패/필수 필드 누락/스키마 밖 형태면 같은 입력으로 1회만 재spawn한다. 재시도에도 스키마 위반이면 그 자리에서 STOP.
- **task-level STOP(스키마는 정상이지만 `status: "STOP"`)은 재시도하지 않는다** — Green을 제외한 모든 단계는 정당한 STOP을 받는 즉시 종료한다.
- **이미 되돌리기 어려운 부작용이 실제로 발생한 뒤에는, 스키마 위반이라도 재시도하지 않는다.** 대표적으로 7단계(pr)에서 `git push` + `gh pr create`가 이미 성공해 실제 PR이 열린 뒤에 출력이 스키마를 위반한 경우 — JSON 자체는 파싱 가능하고 `pr_url` 등 필요한 값을 얻었다면, 재spawn으로 `create-pr`을 다시 실행시켜 중복 PR 시도나 상태 혼선을 일으키지 않는다. 이 경우 스키마 위반 사실을 결과 요약에 그대로 남기고 그 값을 신뢰해 다음 단계(가능하면)로 진행하거나 루프를 마무리한다. 반대로 부작용이 아직 없는 단계(scenarios/red/green/refactor/security/ac_verify처럼 로컬 파일·테스트만 다루는 단계)의 스키마 위반은 원래 규칙대로 재시도한다.

## 진행 표시

각 단계가 끝날 때마다 채팅에 한 줄만 출력한다:

```
[scenarios] OK
[red] OK
[green] OK (attempt 1/3)
[ac_verify] STOP(AC-2 미충족 — 태그 삭제 시 목록 갱신 테스트 없음)
```

단계별 원본 JSON은 채팅에 그대로 나열하지 않고 `docs/features/<spec>/tdd-auto-loop-<이슈번호>.log.jsonl`에 한 줄씩(JSON Lines) append해 세션 기록으로 남긴다.

## STOP 처리

어느 단계에서든 STOP이 확정되면(재시도 소진 포함) 아래를 순서대로 수행하고 루프를 종료한다 — **사람에게 묻지 않는다**:

1. 진행 표시 한 줄로 어느 단계에서 왜 멈췄는지 출력.
2. `docs/features/<spec>/tdd-auto-loop-<이슈번호>.log.jsonl`에 마지막 STOP JSON까지 기록.
3. `gh issue comment $ARGUMENTS --body "..."` — 어느 단계에서, 왜 STOP했는지, 지금까지 어디까지 진행됐는지(예: "Green까지 완료, AC 검증에서 중단")를 이슈에 남긴다.
4. 루프 종료. 사람이 이후 `tdd-loop` 등으로 이어서 처리할지는 사람이 결정한다 — 이 스킬은 재개 로직을 갖지 않는다.

**대표 STOP 조건 예시**: AC 미충족(`ac_passed=false`) / Green 3회 실패 / Security "즉시 수정 필요" 잔존 / commitlint 실패 / E2E 실패 / 0단계 사전 점검 실패 / 스키마 위반 재시도 소진.

## 하지 않을 것

- 어떤 단계에서도 사람에게 승인/확인을 묻지 않는다(0단계~7단계 전부, `AskUserQuestion` 사용 금지).
- 모호한 판단(브랜치 후보 여러 개, AC와 코드 모순 등)을 추측으로 메꾸지 않는다 — 즉시 STOP.
- Green을 제외한 단계에서 task-level 실패를 재시도하지 않는다.
- Green과 AC 검증을 같은 subagent로 묶지 않는다.
- STOP된 상태에서 다음 단계로 임의 진행하지 않는다.
- subagent가 JSON 스키마 밖의 텍스트(설명, 요약)를 출력하도록 허용하지 않는다 — 위반 시 재시도/STOP 규칙을 그대로 적용한다.
- squash merge, 이슈 클로즈는 하지 않는다 — `create-pr`가 PR을 여는 데까지가 이 스킬의 범위다(`tdd-loop`와 동일).
