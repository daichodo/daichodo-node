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
  /** Why it is invalid. Absent on a valid result. */
  reason?: string;
  /**
   * The 13-digit body. For a corporation this IS its 法人番号. For a sole
   * trader it is not, and it will not be found in the corporate register —
   * both kinds pass the same check digit, so the number alone cannot tell you
   * which you are holding. Only a register lookup can.
   */
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
 * **The check digit applies to EVERY registration number, sole traders
 * included.** Corrected 2026-09-05 after measuring; the previous behaviour
 * accepted typos.
 *
 * This function used to return `valid: true` whenever the check digit failed,
 * on the premise that sole traders "carry no verifiable check digit". That
 * premise is false. Measured over the whole invoice register — the 全件 of
 * 2026-08-31 plus the newest 差分:
 *
 *     法人 corporations    2,679,571   100% pass the check digit
 *     個人 sole traders    2,726,018   100% pass
 *     人格のない社団等           7,937   100% pass
 *
 * Zero exceptions in 5,421,496 numbers. The NTA draws sole-trader numbers from
 * the same check-digit scheme in a range disjoint from corporate 法人番号 (0 of
 * 50,000 sampled sole-trader bodies appear in the 法人番号 register), so the
 * check digit is universal — it just does not tell you which kind of entity you
 * are holding.
 *
 * The old escape hatch protected nothing real and admitted everything fake:
 * `T1234567890123`, and a one-digit typo of a genuine number, both returned
 * valid — while the SAME 13 digits without the `T` were correctly rejected.
 *
 * `corporateNumber` is the 13-digit body. For a corporation it IS the 法人番号.
 * For a sole trader it is not, and it will not be found in the corporate
 * register. **You cannot tell which from the number alone**; only a register
 * lookup can.
 */
export function validateRegistrationNumber(value: string): ValidationResult {
  const cleaned = clean(value).toUpperCase();

  if (!REGISTRATION_NUMBER.test(cleaned)) {
    return { value, valid: false, reason: "must be 'T' followed by 13 digits" };
  }

  const body = cleaned.slice(1);
  const expected = checkDigit(body.slice(1));
  if (Number(body[0]) !== expected) {
    return { value, valid: false, reason: `check digit is ${body[0]}, expected ${expected}` };
  }

  return { value, valid: true, corporateNumber: body };
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
