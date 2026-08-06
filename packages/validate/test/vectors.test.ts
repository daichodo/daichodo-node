import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { checkDigit } from '../src/index.js';

/**
 * The TypeScript side of the cross-language check-digit contract.
 *
 * The same `check-digit-vectors.json` is asserted by the Python implementation
 * in the API. They are independent implementations of the same NTA
 * specification; if they diverged, this SDK would call a number invalid that
 * the API accepts — worse than either being wrong alone, because the customer
 * would trust the local answer.
 *
 * The file is pushed here alongside the generated client and must never be
 * hand-edited.
 */
const vectors = JSON.parse(
  readFileSync(fileURLToPath(new URL('./check-digit-vectors.json', import.meta.url)), 'utf8'),
) as { cases: { body: string; digit: number; note?: string }[] };

describe('check-digit vectors', () => {
  it('has a substantial vector set', () => {
    // A truncated file would make every assertion below pass while proving
    // nothing.
    assert.ok(vectors.cases.length > 500, `only ${vectors.cases.length} cases`);
    assert.ok(vectors.cases.some((c) => c.note), 'expected real numbers');
  });

  it('agrees with the API implementation on every vector', () => {
    const mismatches = vectors.cases.filter((c) => checkDigit(c.body) !== c.digit);
    assert.equal(
      mismatches.length,
      0,
      `${mismatches.length} divergences, first: ${JSON.stringify(mismatches.slice(0, 3))}`,
    );
  });

  it('covers every digit position', () => {
    // A weighting bug in one position is the realistic failure, and random
    // coverage can average it away.
    const bodies = new Set(vectors.cases.map((c) => c.body));
    for (let position = 0; position < 12; position += 1) {
      const probe = Array(12).fill('0');
      probe[position] = '7';
      assert.ok(bodies.has(probe.join('')), `position ${position} not covered`);
    }
  });
});
