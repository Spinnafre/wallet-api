import { describe, it, expect } from 'vitest';
import { MoneyVO } from '../../../src/domain/value-objects/money.vo';

describe('MoneyVO', () => {
  it('should create money with positive value', () => {
    const money = MoneyVO.of(100);
    expect(money.value).toBe(100);
  });

  it('should add money values correctly', () => {
    const m1 = MoneyVO.of(100);
    const m2 = MoneyVO.of(50);
    const res = m1.add(m2);
    expect(res.value).toBe(150);
  });

  it('should subtract money values correctly', () => {
    const m1 = MoneyVO.of(100);
    const m2 = MoneyVO.of(50);
    const res = m1.subtract(m2);
    expect(res.value).toBe(50);
  });
});
