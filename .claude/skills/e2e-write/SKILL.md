---
name: e2e-write
description: 기능(feature) 하나의 모든 이슈가 머지된 뒤, docs/features/{기능명}/prd.md의 사용자 스토리를 Playwright E2E 시나리오로 변환해 e2e/{기능명}.spec.ts에 작성한다. 이슈 번호가 아니라 기능명을 인자로 받는다 — tdd-red/tdd-green처럼 이슈 단위 RTL 테스트를 쓰는 스킬이 아니라, 그 이슈들이 다 합쳐진 뒤 실제 브라우저 + 실제 json-server로 전체 사용자 흐름이 살아있는지 검증하는 마지막 단계다. 사용자가 "/e2e-write tag"처럼 기능명을 주거나, "E2E 테스트 작성해줘", "플레이라이트로 시나리오 만들어줘", "실제 브라우저로 이 기능 검증하는 테스트 짜줘", "이 PRD 사용자 스토리를 E2E로 옮겨줘"처럼 말할 때 사용한다. 단위 테스트(RTL)가 mock으로 이미 검증한 세부 분기(trim/중복 검사, 에러 메시지 문구, 함수 호출 인자)는 절대 다시 검증하지 않는다 — 실제 영속화, 새로고침 후 유지, 여러 컴포넌트를 가로지르는 사용자 여정처럼 mock으로는 확인할 수 없는 지점만 E2E로 옮긴다.
---

# e2e-write

기능(feature) 하나가 끝났을 때 — 즉 `docs/features/{기능명}/issues.md`의 이슈가 전부 구현·Green·Refactor·머지된 뒤 — 그 기능의 PRD 사용자 스토리가 실제 브라우저에서 실제 백엔드(json-server)와 함께 처음부터 끝까지 동작하는지 확인하는 스킬이다. `test-scenarios`/`tdd-red`가 이슈 하나의 표면(시그니처)을 RTL로 mock 검증한다면, 이 스킬은 그 이슈들이 합쳐진 결과물이 사용자 관점에서 실제로 작동하는지를 검증한다.

입력: 기능명 (`$ARGUMENTS`, 예: `/e2e-write tag` → `docs/features/tag/`)

## 왜 이슈 단위가 아니라 기능 단위인가

RTL 테스트는 `useNotes()`를 mock해서 `updateNote`가 어떤 인자로 호출됐는지만 확인한다 — 실제 HTTP 요청도, 실제 `db.json` 쓰기도, 페이지 새로고침도 일어나지 않는다. 그런데 각 기능 PRD의 "성공 기준"은 항상 "저장하고 다시 열었을 때도 유지된다"처럼 실제 영속화를 전제로 한다. 이 간극을 메우는 게 E2E의 역할이고, 이 간극은 이슈 하나만 봐서는 안 보인다 — 여러 이슈(예: TAG-1 추가, TAG-2 삭제, TAG-3 검증)가 합쳐진 전체 기능이 실제로 이어져 동작하는지를 봐야 한다. 그래서 인자가 이슈 번호가 아니라 기능명이고, 실행 시점도 마지막 이슈가 `feature/<spec>` 브랜치에 머지된 뒤다.

## 0. 최초 1회 환경 셋업 (멱등)

이 프로젝트에는 아직 Playwright 실행 환경이 없다. 아래 파일들이 이미 있으면 건너뛰고, 없을 때만 만든다 — 매번 실행할 때마다 새로 만들지 않는다.

**`playwright.config.ts`** (프로젝트 루트, 없으면 생성)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- `workers: 1`(직렬 실행)인 이유: 이 앱의 백엔드는 `db.json` 파일 하나를 직접 읽고 쓰는 json-server다. 여러 워커가 동시에 노트를 만들고 지우면 서로의 데이터를 침범하는 경쟁 상태(race condition)가 생기기 쉽다 — 병렬화로 얻는 속도보다 그로 인한 불안정성(flaky)이 더 크다고 판단해 직렬을 기본값으로 둔다. 기능이 늘어나 실행 시간이 실제로 문제가 되면 그때 워커별 데이터 네임스페이스 분리 같은 대안을 고려한다.
- `webServer.command`가 `npm run dev`인 이유: 이 명령이 Vite(5173)와 json-server(3001)를 `concurrently`로 함께 띄운다(`package.json`) — E2E는 프론트만으로는 의미가 없으므로 항상 이 명령으로 전체 스택을 켠다.

**`e2e/global-setup.ts`** / **`e2e/global-teardown.ts`** (없으면 생성)

```ts
// e2e/global-setup.ts
import { copyFileSync, existsSync } from 'node:fs';

const DB = 'db.json';
const BACKUP = 'db.json.e2e-backup';

export default function globalSetup() {
  if (existsSync(DB)) copyFileSync(DB, BACKUP);
}
```

```ts
// e2e/global-teardown.ts
import { copyFileSync, existsSync, unlinkSync } from 'node:fs';

const DB = 'db.json';
const BACKUP = 'db.json.e2e-backup';

export default function globalTeardown() {
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, DB);
    unlinkSync(BACKUP);
  }
}
```

- 왜 필요한가: `db.json`은 `.gitignore`에 없는, git으로 추적되는 실제 파일이다. E2E는 실제 API 호출로 이 파일을 직접 변형시키므로, 아무 안전장치 없이 돌리면 테스트가 커밋된 fixture 데이터를 오염시키거나 반복 실행마다 노트가 계속 쌓인다. 각 테스트가 자기가 만든 데이터를 스스로 정리하는 게 1차 방어선(3장 참고)이고, 이 백업/복원은 테스트가 중간에 실패해 정리 코드가 못 돌았을 때를 대비한 마지막 안전망이다.

**`vite.config.ts`에 `test.exclude` 추가** (아직 없으면)

Playwright 스펙 파일(`e2e/*.spec.ts`)의 `test`/`spec` 네이밍이 vitest의 기본 include 패턴과 겹친다. vitest가 이 파일들까지 주워서 `@playwright/test`의 `test`를 vitest 전역으로 착각해 깨진 상태로 실행하지 않도록 명시적으로 제외한다.

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test-setup.ts',
  exclude: ['**/node_modules/**', '**/e2e/**'],
},
```

**`package.json`에 스크립트 추가** (없으면)

```json
"test:e2e": "playwright test"
```

이 스킬을 실행하는 동안 위 파일 중 하나라도 새로 만들었다면, 다음에 커밋할 때 `CLAUDE.md`의 `## Commands` 표에도 `npm run test:e2e`를 추가하도록 사용자에게 알려준다(다른 스크립트들과 동일하게 문서화되어야 이 프로젝트의 관례와 맞는다) — 이 스킬이 직접 `CLAUDE.md`를 고치지는 않는다.

## 1. 근거 수집

- `docs/features/{기능명}/prd.md`의 "사용자 스토리"(US-N) 절과 "Out of Scope" 절을 읽는다. 성공 기준(개요의 "성공 기준")도 함께 읽는다 — 이게 E2E가 최종적으로 증명해야 하는 것이다.
- `docs/features/{기능명}/issues.md`를 읽고, 각 이슈의 "테스트 계획" 아래 **"수동" 항목을 전부 모은다.** 이 목록이 핵심 소스다 — 이 프로젝트는 이미 각 이슈에서 "RTL(mock)로는 검증할 수 없어서 사람이 직접 확인해야 했던 것"을 수동 시나리오로 스스로 표시해뒀다. E2E가 자동화해야 할 지점은 새로 발명하는 게 아니라 대부분 이 목록에 이미 있다(예: "json-server를 띄운 상태에서 저장 → 새로고침 → 태그 유지 확인").
- `docs/features/{기능명}/spec-fixed.md`가 있으면 검증 규칙의 정본으로 참고하되, 그 규칙의 세부 분기 자체는 이미 RTL이 덮었을 가능성이 높다는 걸 염두에 둔다(2장 참고).
- 이슈들이 건드린 컴포넌트의 기존 RTL 테스트 파일(예: `src/components/NoteEditor.test.tsx`)을 읽는다. 두 가지를 확인한다: (a) 어떤 시나리오가 이미 mock으로 커버됐는지(중복 방지), (b) 그 테스트가 쓰는 `getByRole`/`getByPlaceholderText` 등 셀렉터 문자열 — E2E도 같은 DOM을 다루므로 이 문자열을 그대로 재사용한다. 컴포넌트 소스(JSX)를 직접 열어 실제 텍스트/라벨을 다시 한번 확인하고, 셀렉터를 추측으로 새로 짓지 않는다.
- 이슈 문서에 이번 기능 흐름의 구조적 제약이 적혀 있다면 그대로 따른다. 예를 들어 `docs/features/tag/issues.md`는 `NotesContext.createNote(title, content)`가 `tags`를 받지 않는다고 명시한다 — 즉 새 노트를 만드는 최초 저장에는 태그가 반영되지 않고, 노트를 저장해 기존 노트가 된 뒤 다시 열어 태그를 추가해야 서버에 반영된다. 이런 제약을 모르고 시나리오를 짜면 "새 노트에 태그 붙이고 바로 새로고침" 같은, 애초에 이 앱이 지원하지 않는 흐름을 검증하려다 실패하는 테스트를 쓰게 된다.

## 2. 중복 회피 — 무엇이 이미 단위 테스트의 몫인가

RTL 테스트는 `useNotes()`를 mock하기 때문에 실제 네트워크/파일 시스템에 절대 닿지 않는다. 이 경계선이 그대로 "무엇을 E2E로 옮길지"의 기준이 된다.

| 이미 RTL(mock)이 검증함 — E2E에서 반복하지 않음         | mock으로는 검증 불가능 — E2E의 몫                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| trim/빈 문자열/대소문자 무시 중복 같은 세부 유효성 분기 | 실제 사용자 입력 → 실제 HTTP 요청 → 실제 `db.json` 반영까지 이어지는 전체 흐름             |
| `console.error`에 찍히는 정확한 한국어 메시지 문구      | 페이지를 새로고침해도(즉 컴포넌트가 완전히 새로 마운트돼도) 데이터가 유지되는지            |
| `updateNote`/`createNote`가 어떤 인자로 호출됐는지(spy) | 실제로 그 인자가 서버에 도달해 영속화되는지                                                |
| 컴포넌트 하나의 렌더링 결과(칩 표시/삭제 등)            | 노트 목록 선택 → 편집기 로드 → 저장 → 목록 갱신처럼 여러 컴포넌트를 가로지르는 사용자 여정 |

시나리오를 쓰기 전에 "이 assertion이 mock 환경에서도 통과할 수 있었는가?"를 자문한다. 그렇다면 RTL이 이미 커버했을 가능성이 크므로 E2E에 넣지 않는다. 오직 "실제 서버/새로고침이 있어야만 의미가 생기는 assertion"만 남긴다.

## 3. 시나리오 설계

- 사용자 스토리(US-N) 단위로 `test.describe` 블록을 나눈다.
- **AC 1개당 테스트 1개로 잘게 쪼개지 않는다.** RTL은 이슈별 AC를 촘촘히 덮지만, E2E는 느리고 비용이 크므로 관련된 여러 스토리/AC를 하나의 자연스러운 사용자 여정으로 묶어 "critical path" 위주로 적게, 굵게 쓴다. 1장에서 모은 "수동" 시나리오들이 보통 이 여정의 뼈대가 된다.
  예) 태그 기능이라면 US-1("붙이기")과 US-3("확인하기")을 "태그를 추가하고 저장한 뒤 새로고침해도 그대로 보인다"는 테스트 하나로 합칠 수 있다. US-2("삭제하기")는 이어서 "그 태그를 지우고 저장하면 새로고침 후에도 사라져 있다"로 이어 붙일 수 있다.
- PRD "Out of Scope"에 있는 항목은 시나리오로 만들지 않는다 — 이번 기능이 지원하지 않는 흐름을 검증하려는 테스트는 그 자체로 잘못된 전제다.
- 이슈 문서에서 발견한 구조적 제약(1장 마지막 항목 같은 것)을 시나리오 순서에 반영한다 — 예를 들어 "새 노트 생성 시 태그"가 아니라 "기존 노트를 열어 태그 편집"을 골든 패스로 삼는다.

## 4. 코드 작성

- **위치/네이밍**: `e2e/{기능명}.spec.ts` (예: `e2e/tag.spec.ts`). `docs/features/{기능명}/`의 폴더명을 그대로 쓴다.
- `@playwright/test`의 `test`/`expect`만 사용한다. Vitest의 `describe`/`it`/`vi`를 쓰지 않는다 — 완전히 다른 테스트 러너다.
- **로케이터는 접근성 우선으로**: `page.getByRole(...)`, `page.getByPlaceholder(...)`, `page.getByText(...)`를 쓰고, 1장에서 확인한 기존 RTL 테스트의 셀렉터 문자열을 그대로 재사용한다. CSS 클래스나 임의 `data-testid`를 새로 만들지 않는다 — 이 컴포넌트들은 이미 RTL에서 role/placeholder로 접근 가능하다는 게 증명돼 있다.
- **자동 재시도 assertion을 쓰고 임의 대기를 넣지 않는다**: `expect(locator).toBeVisible()`류는 조건이 맞을 때까지 자체적으로 재시도하므로 `page.waitForTimeout(...)` 같은 고정 sleep이 필요 없다. 저장 후 서버 반영을 기다려야 한다면 UI 변화(예: 칩이 사라짐/나타남)에 대한 assertion으로 기다리게 하지, 임의 시간으로 때우지 않는다.
- **테스트 독립성**: 각 테스트는 자신이 쓸 노트를 UI를 통해 직접 만든다(예: 제목에 `E2E ${Date.now()}` 같은 유일한 문자열을 써서 기존 `db.json` 시드 데이터나 다른 테스트와 절대 겹치지 않게 한다). `db.json`을 직접 열어 데이터를 미리 심어두지 않는다 — 실제 사용자가 밟는 경로(생성 UI)를 그대로 타는 것 자체가 E2E의 목적이다. 테스트가 끝나면 `test.afterEach`에서 자신이 만든 노트를 UI의 삭제 버튼으로 지운다(0장의 백업/복원은 이 정리가 실패했을 때의 안전망일 뿐, 정리 자체를 대신하지 않는다).
- **여정이 길면 `test.step(...)`으로 구간을 나눈다** — "노트 생성" → "태그 추가" → "저장" → "새로고침 후 확인"처럼 구간을 나눠두면 실패했을 때 어느 단계에서 깨졌는지 리포트에서 바로 보인다.

## 5. 실행 및 확인

```bash
npx playwright test e2e/{기능명}.spec.ts
```

실패하면 `playwright-report/`의 트레이스/스크린샷으로 원인을 먼저 확인한다 — RTL의 Red 단계처럼 "아직 구현이 없어서" 실패하는 게 아니라(이 시점엔 기능이 이미 Green 상태여야 한다), 실제 실행 환경 문제(서버가 안 떴다, 셀렉터가 실제 마크업과 다르다, 이전 실행의 잔여 데이터)일 가능성이 높다.

## 6. 마무리 보고

몇 개의 사용자 스토리를 몇 개의 시나리오로 옮겼는지, 전부 통과했는지, 0장에서 새로 만든 환경 파일이 있는지(있다면 `CLAUDE.md` Commands 갱신을 사용자에게 제안)를 요약한다. **커밋은 하지 않는다** — 다른 TDD 단계 스킬들과 동일하게, 최종 커밋 여부는 개발자가 diff를 보고 결정한다.

## 하지 않을 것

- 단위 테스트(RTL, mock)가 이미 검증하는 세부 분기(trim/중복/에러 메시지 문구/함수 호출 인자)를 E2E로 다시 쓰지 않는다.
- PRD "Out of Scope" 항목이나 이슈 문서가 명시한 구조적 제약(예: 새 노트 생성 시점엔 태그가 반영되지 않는 것)을 벗어나는 흐름을 시나리오로 만들지 않는다.
- `db.json`을 직접 편집해 테스트 데이터를 심지 않는다 — 항상 UI를 통해서만 데이터를 만들고 지운다.
- `src/` 아래 구현 코드를 수정하지 않는다. 테스트를 위해 컴포넌트에 `data-testid`를 추가하고 싶은 유혹이 들어도, 먼저 기존 role/placeholder로 접근 가능한지 확인한다 — RTL 테스트가 이미 그렇게 접근하고 있다면 E2E도 그럴 수 있다.
- `page.waitForTimeout` 같은 임의 sleep을 assertion 대신 쓰지 않는다.
- 커밋하거나 푸시하지 않는다.
