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

  it('accepts sole traders, which have no check digit', () => {
    // Roughly half the register. Rejecting these would reject half of
    // everything a customer looks at.
    const result = validateRegistrationNumber('T1234567890123');
    assert.equal(result.valid, true);
    assert.equal(result.corporateNumber, undefined);
    assert.match(result.reason ?? '', /法人番号/);
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
