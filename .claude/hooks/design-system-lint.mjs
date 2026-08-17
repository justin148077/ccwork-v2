#!/usr/bin/env node
// PreToolUse hook: Edit/Write로 새로 작성/추가되는 .tsx/.css 내용을
// docs/design-system/do-dont.md의 기계 판별 가능한 Don't 규칙과 대조해 위반 시 차단한다.

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});

process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = input.tool_name;
  if (toolName !== 'Edit' && toolName !== 'Write') process.exit(0);

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || '';
  if (!/\.(tsx|css)$/.test(filePath)) process.exit(0);

  const text = toolName === 'Write' ? (toolInput.content ?? '') : (toolInput.new_string ?? '');
  if (!text) process.exit(0);

  const violations = [];

  if (/\b(text|bg|border)-black\b/.test(text) || /#000000\b/.test(text) || /#000\b/.test(text)) {
    violations.push(
      "순수 검정(pure black) 사용 금지 — on_surface 계열(`--color-foreground`, #2b3437)을 쓸 것."
    );
  }

  if (/\bshadow-(sm|md|lg|xl|2xl)\b/.test(text)) {
    violations.push(
      '기본 Tailwind shadow 프리셋(shadow-sm/md/lg/xl/2xl) 금지 — Ambient Shadow 값(blur 24-40px, opacity 6%)을 임의값(`shadow-[...]`)으로 표현할 것.'
    );
  }

  if (/\bborder-border\b/.test(text)) {
    violations.push(
      '`border-border`로 섹션 경계를 긋는 것은 No-Line Rule 위반 — 배경색 단계 차이(Surface Hierarchy)로 표현할 것.'
    );
  }

  if (violations.length === 0) process.exit(0);

  const reason = [
    `[design-system] ${filePath} 변경 내용이 디자인 시스템 Don't 규칙을 위반합니다:`,
    ...violations.map((v) => `- ${v}`),
    '전체 규칙: docs/design-system/do-dont.md',
  ].join('\n');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
});
