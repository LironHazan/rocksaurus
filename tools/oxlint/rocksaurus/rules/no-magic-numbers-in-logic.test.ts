import { RuleTester } from 'oxlint/plugins-dev';
import rocksaurus from '../index.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const magic = (value: string, where: string) => ({ messageId: 'magic', data: { value, where } });

new RuleTester().run('no-magic-numbers-in-logic', rocksaurus.rules['no-magic-numbers-in-logic']!, {
  valid: [
    // named: the point of the rule
    'const LIMIT_S = 3.5; if (t > LIMIT_S) go();',
    // 0, 1, -1 and 2: empty, one, the sign, halves and odd/even
    'if (n > 0 && k < 1 && x !== -1 && i % 2 === 0) go();',
    // scene data: arithmetic, coordinates, colours, arguments
    'mesh.position.set(0.3, 1.75, -2.6); const c = 0xff7a1a; const y = x * 0.5 + 0.3;',
    // a for loop's own count: how many pickets a builder makes
    'for (let i = 0; i < 14; i++) add(picket(i));',
    // other calls' arguments are scene data too
    'tone(bus, when, 2900, 0.1);',
  ],
  invalid: [
    { code: 'if (t > 3.5) go();', errors: [magic('3.5', 'a comparison')] },
    { code: 'const late = t >= -0.4;', errors: [magic('-0.4', 'a comparison')] },
    { code: 'const third = i % 3;', errors: [magic('3', 'a modulo')] },
    { code: 'const hz = Math.min(4000, f * 3);', errors: [magic('4000', 'a Math.min/Math.max limit')] },
    { code: 'setTimeout(done, 250);', errors: [magic('250', "a timer's delay")] },
    // a loop's test that isn't its own count is still a decision
    { code: 'while (y > 260) y -= step;', errors: [magic('260', 'a comparison')] },
  ],
});
