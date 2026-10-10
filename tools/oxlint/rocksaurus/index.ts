import { eslintCompatPlugin } from '@oxlint/plugins';

import { noMagicNumbersInLogicRule } from './rules/no-magic-numbers-in-logic.ts';

/** Rocksaurus's own Oxlint rules: house rules from AGENTS.md that no stock or vendored rule checks. */
const rocksaurusPlugin = eslintCompatPlugin({
  meta: { name: 'rocksaurus' },
  rules: {
    'no-magic-numbers-in-logic': noMagicNumbersInLogicRule,
  },
});

export default rocksaurusPlugin;
