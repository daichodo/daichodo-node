/**
 * Format and check-digit validation for Japanese corporate numbers (法人番号)
 * and qualified invoice registration numbers (登録番号).
 *
 * Zero dependencies, no network, no API key. The rules come from the National
 * Tax Agency's published specification, so this is derivable by anyone — which
 * is exactly why it is given away.
 */

const CORPORATE_NUMBER = /^\d{13}$/;
const REGISTRATION_NUMBER = /^T\d{13}$/;

/** Separators people paste from invoices and spreadsheets. */
const SEPARATORS = /[\s\-‐－ー―]/g;

export interface ValidationResult {
  /** The input, unmodified. */
  value: string;
  valid: boolean;
  /**
   * Why it is invalid — or a note qualifying a valid result. A registration
   * number that is well-formed but not derived from a 法人番号 belongs to a
   * sole trader: valid, and simply not linked to a corporate number.
   */
  reason?: string;
  /** The 法人番号 this number corresponds to, when it has one. */
  corporateNumber?: string;
}

/**
 * The 法人番号 check digit for a 12-digit body.
 *
 *   検査用数字 = 9 - (Σ(n=1..12) Pn × Qn) mod 9
 *
 * where `Pn` is the nth digit counting from the RIGHT, and `Qn` is 1 for odd n
 * and 2 for even n.
 *
 * The right-to-left ordering is the part that is easy to reverse, and a
 * reversed implementation still yields a plausible digit for roughly one number
 * in nine — so it passes casual testing and fails in production.
 */
export function checkDigit(body: string): number {
  if (body.length !== 12 || !/^\d{12}$/.test(body)) {
    throw new Error('check digit is computed over exactly 12 digits');
  }

  let total = 0;
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(body[11 - i]); // right to left
    total += digit * ((i + 1) % 2 === 0 ? 2 : 1);
  }
  return 9 - (total % 9);
}

/** Validate a 13-digit 法人番号, including its check digit. */
export function validateCorporateNumber(value: string): ValidationResult {
  const cleaned = clean(value);

  if (!CORPORATE_NUMBER.test(cleaned)) {
    return { value, valid: false, reason: 'must be exactly 13 digits' };
  }

  const expected = checkDigit(cleaned.slice(1));
  if (Number(cleaned[0]) !== expected) {
    return {
      value,
      valid: false,
      reason: `check digit is ${cleaned[0]}, expected ${expected}`,
    };
  }

  return { value, valid: true, corporateNumber: cleaned };
}

/**
 * Validate a 登録番号 (`T` + 13 digits).
 *
 * For corporations the 13 digits are the 法人番号, so the check digit applies.
 * Sole traders are assigned numbers that are not derived from a 法人番号 and
 * carry no verifiable check digit — format is all that can be asserted. Roughly
 * half the register is sole traders, so treating them as invalid would reject
 * half of everything you look at.
 */
export function validateRegistrationNumber(value: string): ValidationResult {
  const cleaned = clean(value).toUpperCase();

  if (!REGISTRATION_NUMBER.test(cleaned)) {
    return { value, valid: false, reason: "must be 'T' followed by 13 digits" };
  }

  const body = cleaned.slice(1);
  if (Number(body[0]) === checkDigit(body.slice(1))) {
    return { value, valid: true, corporateNumber: body };
  }

  return { value, valid: true, reason: 'not derived from a 法人番号' };
}

/** True if the value is a well-formed number of either kind. */
export function isValid(value: string): boolean {
  const cleaned = clean(value).toUpperCase();
  return cleaned.startsWith('T')
    ? validateRegistrationNumber(value).valid
    : validateCorporateNumber(value).valid;
}

function clean(value: string): string {
  return value.trim().replace(SEPARATORS, '');
}
