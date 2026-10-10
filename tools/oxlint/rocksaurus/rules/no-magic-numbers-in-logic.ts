import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

// AGENTS.md: "A number that means something (a limit, a timeout, a threshold, a stride) is a named constant with its
// unit and reason. Scene data stays literal: geometry coordinates, colours, beat sheets, note tables." The stock
// no-magic-numbers rule cannot tell the two apart (it flags ~18,000 numbers here, nearly all scene data), so this
// rule only looks where a number makes a DECISION:
//   - an operand of a comparison: `t > 3.5`, `count === 12` (but not a `for` loop's count: that's scene data)
//   - the divisor of `%`: `i % 3`
//   - a limit given to Math.min / Math.max: `Math.min(4, bites)`
//   - a timer's delay: `setTimeout(fn, 250)`
// 0, 1, -1 and 2 are allowed everywhere: empty, one, the first, the sign, halves and odd/even. Arithmetic on scene data (`x + 0.3`, a
// pose, a colour, a coordinate) is not checked: that's scene data, which stays literal.

const ALLOWED: ReadonlySet<number> = new Set([0, 1, -1, 2]);
const COMPARISONS: ReadonlySet<string> = new Set(['<', '<=', '>', '>=', '===', '!==', '==', '!=']);
const LIMITS: ReadonlySet<string> = new Set(['min', 'max']);
const TIMERS: ReadonlySet<string> = new Set(['setTimeout', 'setInterval']);

function isNumberLiteral(node: ESTree.Node): node is ESTree.NumericLiteral {
  return node.type === 'Literal' && Number.isFinite(node.value);
}

/** The number a literal stands for, its sign included (`-0.4` is a unary minus on 0.4). */
function signedValue(literal: ESTree.NumericLiteral): number {
  const parent = literal.parent;
  return parent.type === 'UnaryExpression' && parent.operator === '-' ? -literal.value : literal.value;
}

/** The node that stands in the expression for this literal: the unary minus around it, if there is one. */
function operandOf(literal: ESTree.NumericLiteral): ESTree.Node {
  const parent = literal.parent;
  return parent.type === 'UnaryExpression' && parent.operator === '-' ? parent : literal;
}

function isLimitCall(call: ESTree.CallExpression): boolean {
  const callee = call.callee;
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'Math' &&
    callee.property.type === 'Identifier' &&
    LIMITS.has(callee.property.name)
  );
}

function isTimerDelay(call: ESTree.CallExpression, operand: ESTree.Node): boolean {
  const callee = call.callee;
  const name = callee.type === 'Identifier' ? callee.name : null;
  return name !== null && TIMERS.has(name) && call.arguments[1] === operand;
}

/**
 * A `for` loop's own count, `for (let i = 0; i < 14; i++)`: how many pickets, petals or chirps a builder makes. That
 * is scene data (like a coordinate), not a decision.
 */
function isLoopCount(comparison: ESTree.BinaryExpression): boolean {
  const loop = comparison.parent;
  return loop.type === 'ForStatement' && loop.test === comparison;
}

/** In an operator: a comparison (but not a loop's own count), or the divisor of a modulo. */
function operatorDecision(op: ESTree.BinaryExpression, operand: ESTree.Node): string | null {
  if (COMPARISONS.has(op.operator)) return isLoopCount(op) ? null : 'a comparison';
  return op.operator === '%' && op.right === operand ? 'a modulo' : null;
}

/** In a call: a Math.min/Math.max limit, or a timer's delay. */
function callDecision(call: ESTree.CallExpression, operand: ESTree.Node): string | null {
  if (isLimitCall(call)) return 'a Math.min/Math.max limit';
  return isTimerDelay(call, operand) ? "a timer's delay" : null;
}

/** Where the number decides something, if it does: what to call that place in the message. */
function decision(operand: ESTree.Node): string | null {
  const parent = operand.parent;
  if (parent?.type === 'BinaryExpression') return operatorDecision(parent, operand);
  if (parent?.type === 'CallExpression') return callDecision(parent, operand);
  return null;
}

/** Numbers that make a decision (a threshold, a limit, a stride, a delay) must be named constants. */
export const noMagicNumbersInLogicRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow unnamed numbers in comparisons, modulos, Math.min/max limits and timer delays.',
    },
    messages: {
      magic:
        'Name {{value}}: it decides something here ({{where}}). Use a named constant with its unit and reason, e.g. `const FIRST_PICTURE_TIMEOUT_MS = 5000`.',
    },
  },
  createOnce(context) {
    return {
      Literal(node) {
        if (!isNumberLiteral(node)) return;
        const value = signedValue(node);
        if (ALLOWED.has(value)) return;
        const where = decision(operandOf(node));
        if (where !== null) context.report({ node, messageId: 'magic', data: { value: String(value), where } });
      },
    };
  },
});
