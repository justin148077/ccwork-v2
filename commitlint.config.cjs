const bodyMinLines =
  (minLines) =>
  (parsed, when = 'always') => {
    const lines = (parsed.body || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const hasEnoughLines = lines.length >= minLines;

    return when === 'never'
      ? [!hasEnoughLines, `body must have fewer than ${minLines} lines`]
      : [hasEnoughLines, `body must have at least ${minLines} lines`];
  };

module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'body-min-lines': bodyMinLines(2),
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'init',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],
    'body-empty': [2, 'never'],
    'body-min-lines': [2, 'always'],
  },
};
