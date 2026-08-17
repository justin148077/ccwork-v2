---
name: create-pr
description: 현재 브랜치의 커밋을 요약해 PR 초안(제목/본문)을 만들고, 개발자 승인 후 npm run test:e2e를 돌려 통과할 때만 git push + gh pr create로 PR을 생성하는 스킬. 사용자가 "/create-pr"을 명시적으로 호출하거나, "PR 만들어줘", "PR 올려줘", "PR 보내줘", "이거 머지하자", "이거 PR로 올리자", "PR 열어줘"처럼 말할 때 반드시 이 스킬을 사용한다 — git push나 gh pr create를 직접 호출하지 말고 항상 이 스킬을 거친다. E2E가 실패하면 PR 생성을 중단하고 원인 진단 절차를 안내한다 — E2E 코드를 고쳐 억지로 통과시키는 것은 이 스킬이 절대 하지 않는 일이다.
---

# create-pr

`CLAUDE.md`의 TDD 이슈 사이클 7단계("커밋 → PR → squash merge → 이슈 클로즈") 중 "PR 생성"을 자동화하는 스킬이다. 이미 커밋된 변경사항을 대상으로 PR 초안을 만들고, 개발자 승인을 받은 뒤 E2E 테스트가 통과했을 때만 실제로 push하고 PR을 연다. 커밋 자체는 이 스킬의 범위가 아니다 — 커밋 안 된 변경이 있으면 먼저 커밋하라고 안내하고 멈춘다.

입력: 없음 (기본). 베이스 브랜치를 직접 지정하고 싶으면 `$ARGUMENTS`로 브랜치명을 줄 수 있다 (예: `/create-pr main`).

## 왜 이렇게 단계를 나누는가

PR 제목/본문은 diff를 보고 사람이 검토하기 전까지는 "초안"일 뿐이다. 이 프로젝트의 커밋 메시지·PR 규칙(Conventional Commits, 한글 본문)처럼 PR도 팀이 계속 참고할 기록이 되므로, 확정 전에 개발자가 고칠 기회가 있어야 한다. 그리고 E2E는 이 프로젝트에서 RTL(mock) 단위 테스트가 못 보는 것 — 실제 서버·실제 영속화·컴포넌트를 가로지르는 사용자 흐름 — 을 검증하는 마지막 관문이다(`e2e-write` 스킬 참고). 여기서 실패했다는 건 유닛 테스트가 초록불이어도 실제 흐름 어딘가는 깨져 있다는 뜻이므로, PR을 열어 리뷰어에게 깨진 상태를 넘기지 않도록 여기서 멈춘다.

## 실행 순서

### 0. 사전 확인

- `git status`로 커밋 안 된 변경(staged/unstaged/untracked)이 있는지 확인한다. 있으면 **여기서 멈춘다** — 이 스킬은 커밋을 대신 하지 않는다. `CLAUDE.md`의 커밋 규칙(Conventional Commits, `-m` 여러 개로 본문 최소 2줄)을 짧게 안내하고, 커밋 후 다시 불러달라고 요청한다.
- 베이스 브랜치를 정한다:
  - `$ARGUMENTS`로 브랜치가 주어졌으면 그대로 쓴다.
  - 아니면 현재 브랜치가 `feature/*` 계열 이슈 브랜치이고, 그 조상 중에 현재 브랜치와 다른 `feature/*` 브랜치(스펙 브랜치)가 있는지 확인한다 — 예: `git for-each-ref --format='%(refname:short)' refs/heads refs/remotes/origin/*` 로 후보를 모으고, 각각에 대해 `git merge-base --is-ancestor <candidate> HEAD`가 성공하고 `<candidate>`가 저장소 기본 브랜치(main)가 아니면서 현재 브랜치 자신도 아닌 것을 찾는다. 이 프로젝트는 이슈 브랜치(`feature/tag-delete` 등)가 기능 스펙 브랜치(`feature/tag-spec`)로 먼저 PR되고, 스펙 브랜치가 나중에 `main`으로 PR되는 2단 구조를 쓴다 — 그래서 무조건 `main`을 베이스로 찍지 않는다.
  - 후보가 여러 개이거나 하나도 안 잡히면 추측하지 말고 개발자에게 직접 물어본다.
- 이번 PR이 닫을 GitHub 이슈 번호를 추정한다: `git log <base>..HEAD --format=%s`에서 커밋 제목에 있는 `#숫자` 또는 `(TAG-숫자)` 같은 패턴을 찾는다. 이 프로젝트는 이슈 번호와 `TAG-N` 라벨이 1:1로 대응한다(예: `TAG-3` → issue #3, `gh issue list --state all`로 확인 가능). 찾으면 나중에 본문에 `Closes #N`을 넣고, 못 찾으면 그냥 생략한다 — 억지로 끼워 맞추지 않는다.

### 1. PR 초안 생성

- `git log <base>..HEAD --oneline`과 `git diff <base>...HEAD --stat`, 필요하면 전체 diff를 읽어 이번 PR에 뭐가 들어가는지 파악한다.
- **제목**: 이 프로젝트 커밋 메시지 관례(`type: 한글 제목`, type은 `commitlint.config.cjs`의 `build/chore/ci/docs/feat/fix/init/perf/refactor/revert/style/test`)를 따른다. 커밋이 여러 개면 가장 대표적인 변경을 기준으로 하나로 합쳐 짓는다.
- **본문**: 이 저장소의 기존 PR(#5, #6)과 동일한 템플릿을 쓴다.

  ```
  ## Summary
  - 변경 사항 요약 (커밋 메시지가 아니라 diff 내용 기준으로, 리뷰어가 이해할 수 있게)

  ## Test plan
  - [x] 이미 통과 확인된 항목 (예: `npm test` 결과, ac-verifier/security-review 완료 여부 — git log나 대화 맥락에서 확인 가능한 것만 적는다)
  - [ ] `npm run test:e2e` — 3단계에서 실행 후 통과하면 체크

  Closes #N   (0단계에서 이슈 번호를 찾았을 때만)

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```

  Test plan에 실제로 확인하지 않은 항목을 지어내지 않는다 — 이번 브랜치 작업 중 대화 맥락이나 커밋 이력에 근거가 있는 것만 적는다.

### 2. 승인 요청 — 하드 게이트

초안(제목 + 본문)을 그대로 보여주고 승인을 요청한다. 개발자가 수정을 요청하면 반영해서 다시 보여준다. **명시적 승인 전까지 3단계로 넘어가지 않는다.** 여기서 받는 승인은 이후 4단계의 `git push`와 `gh pr create`까지 포괄한다 — E2E 통과라는 조건이 붙어 있을 뿐, 승인 이후 별도로 push 여부를 다시 묻지 않는다.

### 3. E2E 실행

```bash
npm run test:e2e
```

### 4. E2E 실패 시 — 중단

PR 생성을 중단한다. **push도, `gh pr create`도 하지 않는다.** 아래 안내를 그대로 출력한다:

```
E2E 실패로 PR 생성을 중단합니다.

① npx playwright show-report 로 Trace Viewer를 열어 실패 지점을 확인하세요
② 어느 레이어(API/렌더링/로직)에서 깨졌는지 판별하세요
③ 해당 단위 테스트에 케이스를 추가하세요 (Red)
④ 프로덕션 코드를 수정하세요 (Green) → 다시 /create-pr

⚠ E2E 코드를 고쳐서 통과시키는 것은 금지입니다 — 근본 원인을 회피하는 것일 뿐입니다.
```

E2E는 유닛 테스트가 mock으로 가려 놓은 실제 흐름을 검증하는 마지막 레이어다. 여기서 실패했는데 E2E의 assertion이나 셀렉터, 대기 시간을 고쳐서 통과시키면 실제 버그는 그대로 남은 채 신호만 꺼버리는 것과 같다 — 그래서 이 스킬은 어떤 경우에도 `e2e/*.spec.ts`를 수정하지 않는다. 수정은 항상 원인이 있는 레이어(단위 테스트 + 프로덕션 코드)에서 이뤄져야 하고, 그 사이클(Red → Green)이 끝난 뒤 이 스킬을 처음부터 다시 실행한다 — 코드가 바뀌었으므로 초안도 다시 만든다.

### 5. E2E 통과 시 — push + PR 생성

- 2단계 초안의 Test plan에서 `npm run test:e2e` 항목을 체크된 상태로 갱신한다.
- 현재 브랜치가 원격에 없거나 추적 브랜치가 없으면(`git rev-parse --abbrev-ref --symbolic-full-name @{u}` 실패) `git push -u origin <현재 브랜치>`, 이미 추적 중이면 `git push`.
- `gh pr create --base <base> --title "..." --body "$(cat <<'EOF' ... EOF)"` 로 PR을 만든다 (본문은 HEREDOC으로 넘겨 줄바꿈이 깨지지 않게 한다).
- 생성된 PR URL을 개발자에게 전달한다.

## 제약 — 반드시 지킬 것

- **커밋은 절대 하지 않는다.** 0단계에서 커밋 안 된 변경을 발견하면 멈추고 안내만 한다.
- **E2E가 실패한 상태에서는 `git push`도 `gh pr create`도 실행하지 않는다.**
- **E2E 실패 시 `e2e/*.spec.ts`를 수정하지 않는다.**
- 베이스 브랜치를 확신 없이 추측하지 않는다 — 후보가 애매하면 개발자에게 묻는다.
- Test plan 체크리스트에 실제로 확인하지 않은 항목을 넣지 않는다.

## 하지 않을 것

- E2E 실패를 우회하려고 E2E 코드(assertion/셀렉터/대기시간)를 고쳐 통과시키지 않는다.
- 승인 게이트(2단계) 없이 바로 push+PR로 넘어가지 않는다.
- PR을 병합(merge)하거나 이슈를 클로즈하지 않는다 — 이 스킬은 `gh pr create`까지만 하고 멈춘다. squash merge와 이슈 클로즈는 `CLAUDE.md` TDD 사이클의 다음 단계로, 개발자가 별도로 처리한다.
- 커밋 안 된 변경을 대신 커밋하고 넘어가지 않는다.
