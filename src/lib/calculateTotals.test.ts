import { describe, it, expect } from 'vitest';
import { calculateTotals } from './calculateTotals';
import { LineItem } from '../types';

describe('calculateTotals', () => {
  it('should return zeros for empty items array', () => {
    const result = calculateTotals([], 0, 7.5);
    expect(result).toEqual({
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      total: 0,
    });
  });

  it('should calculate basic subtotal with no discount or tax', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Brand Design', quantity: 2, unitPrice: 50000 },
      { id: '2', description: 'Web Development', quantity: 1, unitPrice: 150000 },
    ];
    const result = calculateTotals(items, 0, 0);
    expect(result.subtotal).toBe(250000);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableAmount).toBe(250000);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(250000);
  });

  it('should calculate discount correctly', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Service', quantity: 1, unitPrice: 100000 },
    ];
    // 10% discount
    const result = calculateTotals(items, 10, 0);
    expect(result.subtotal).toBe(100000);
    expect(result.discountAmount).toBe(10000);
    expect(result.taxableAmount).toBe(90000);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(90000);
  });

  it('should calculate tax on discounted amount (7.5% Nigerian standard VAT)', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Consulting', quantity: 1, unitPrice: 200000 },
    ];
    // 10% discount = 20,000 discount -> 180,000 taxable. 7.5% of 180,000 = 13,500. Total = 193,500
    const result = calculateTotals(items, 10, 7.5);
    expect(result.subtotal).toBe(200000);
    expect(result.discountAmount).toBe(20000);
    expect(result.taxableAmount).toBe(180000);
    expect(result.taxAmount).toBe(13500);
    expect(result.total).toBe(193500);
  });

  it('should handle zero or negative quantities safely', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Invalid item', quantity: -2, unitPrice: 5000 },
      { id: '2', description: 'Valid item', quantity: 3, unitPrice: 1000 },
    ];
    const result = calculateTotals(items, 0, 0);
    expect(result.subtotal).toBe(3000);
    expect(result.total).toBe(3000);
  });

  it('should round cents accurately without float precision noise', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Item 1', quantity: 3, unitPrice: 19.99 },
    ];
    // 3 * 19.99 = 59.97. 7.5% tax = 4.49775 -> 4.50. Total = 64.47
    const result = calculateTotals(items, 0, 7.5);
    expect(result.subtotal).toBe(59.97);
    expect(result.taxAmount).toBe(4.5);
    expect(result.total).toBe(64.47);
  });
});
