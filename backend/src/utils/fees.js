/**
 * Calculate transaction fee in USD according to fee rules defined in the
 * requirements. A fee of 5% applies to amounts below $200. Above and
 * including $200 the fee drops to 2.5%. The fee is computed on the receive side
 * and returned rounded using ISO‑4217 rounding (half‑up) to two decimal
 * places【632415089052039†L110-L160】.
 *
 * @param {number} amountUsd – The USD amount being transacted. Must be >= 0.
 * @returns {number} The fee in USD, rounded to two decimal places.
 */
export function calculateFee(amountUsd) {
  if (amountUsd < 0 || typeof amountUsd !== 'number') {
    throw new Error('Invalid amount');
  }
  const rate = amountUsd < 200 ? 0.05 : 0.025;
  const fee = amountUsd * rate;
  // Round half‑up using Number.EPSILON to mitigate floating point issues【632415089052039†L154-L160】.
  return Math.round((fee + Number.EPSILON) * 100) / 100;
}