import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkDigit,
  isValid,
  validateCorporateNumber,
  validateRegistrationNumber,
} from '../src/index.js';

// Real 法人番号, taken from published NTA data rather than invented, so the
// check-digit implementation is verified against numbers actually issued.
const REAL = ['1010001153225', '1010001262216', '1010001262934', '1090001018602'];

describe('checkDigit', () => {
  it('reproduces the digit on real numbers', () => {
    for (const number of REAL) {
      assert.equal(checkDigit(number.slice(1)), Number(number[0]));
    }
  });

  it('weights digits right to left', () => {
    // The ordering is easy to reverse, and a reversed implementation still
    // produces a plausible digit for ~1 number in 9 - so it survives casual
    // testing. Assert it directly, and assert the reverse differs.
    assert.equal(checkDigit('010001153225'), 1);
    assert.notEqual(checkDigit('522351100010'), 1);
  });

  it('refuses anything that is not 12 digits', () => {
    assert.throws(() => checkDigit('123'));
    assert.throws(() => checkDigit('abcdefghijkl'));
  });
});

describe('validateCorporateNumber', () => {
  it('accepts real numbers', () => {
    for (const number of REAL) {
      assert.equal(validateCorporateNumber(number).valid, true);
    }
  });

  it('rejects a flipped check digit', () => {
    const result = validateCorporateNumber('2010001153225');
    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /check digit/);
  });

  it('rejects malformed input', () => {
    for (const bad of ['', '123', '12345678901234', 'abcdefghijklm']) {
      assert.equal(validateCorporateNumber(bad).valid, false);
    }
  });

  it('strips the separators people paste', () => {
    assert.equal(validateCorporateNumber('1010-0011-53225').valid, true);
    assert.equal(validateCorporateNumber(' 1010001153225 ').valid, true);
  });
});

describe('validateRegistrationNumber', () => {
  it('exposes the corporate number for corporations', () => {
    const result = validateRegistrationNumber('T1010001153225');
    assert.equal(result.valid, true);
    assert.equal(result.corporateNumber, '1010001153225');
  });

  it('applies the check digit to sole traders too', () => {
    // Measured 2026-09-05 over the whole register: 2,726,018 sole-trader
    // numbers, 100% pass the check digit. The body is NOT a 法人番号 - none of
    // 50,000 sampled appear in the corporate register - but it comes from the
    // same numbering scheme, so the number alone cannot tell you which kind of
    // entity it belongs to.
    const result = validateRegistrationNumber('T6000000000011');
    assert.equal(result.valid, true);
    assert.equal(result.corporateNumber, '6000000000011');
  });

  it('rejects a failed check digit instead of excusing it', () => {
    // The regression this test exists to prevent. These all returned
    // valid: true before 2026-09-05, excused as "not derived from a 法人番号".
    // Since every genuine number passes, a failure is a typo or a fabrication.
    for (const fabricated of ['T1234567890123', 'T6000000000012', 'T0000000000000']) {
      const result = validateRegistrationNumber(fabricated);
      assert.equal(result.valid, false, `${fabricated} should be rejected`);
      assert.match(result.reason ?? '', /check digit/);
    }
  });

  it('never becomes more permissive because of the T prefix', () => {
    // The old bug in one line: isValid('1810000009216') was false while
    // isValid('T1810000009216') was true, for the same 13 digits.
    const body = '1810000009216';
    assert.equal(validateCorporateNumber(body).valid, false);
    assert.equal(validateRegistrationNumber(`T${body}`).valid, false);
    assert.equal(isValid(`T${body}`), false);
  });

  it('rejects malformed input', () => {
    for (const bad of ['T123', '1010001153225', 'TT1010001153225']) {
      assert.equal(validateRegistrationNumber(bad).valid, false);
    }
  });

  it('accepts a lowercase t', () => {
    assert.equal(validateRegistrationNumber('t1010001153225').valid, true);
  });
});

describe('isValid', () => {
  it('routes by prefix', () => {
    assert.equal(isValid('T1010001153225'), true);
    assert.equal(isValid('1010001153225'), true);
    assert.equal(isValid('2010001153225'), false);
    assert.equal(isValid('nonsense'), false);
  });
});
