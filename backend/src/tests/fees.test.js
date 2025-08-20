import { calculateFee } from '../utils/fees.js';

describe('Fee calculation', () => {
  test('amount < $200 uses 5% fee', () => {
    expect(calculateFee(150)).toBe(7.5);
  });
  test('amount just below threshold', () => {
    expect(calculateFee(199.99)).toBe(10.0);
  });
  test('amount exactly at threshold uses lower fee', () => {
    expect(calculateFee(200)).toBe(5.0);
  });
  test('amount above threshold', () => {
    expect(calculateFee(825)).toBe(20.63);
  });
});