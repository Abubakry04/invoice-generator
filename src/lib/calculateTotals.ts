import { LineItem, InvoiceTotals } from '../types';

/**
 * Calculates subtotal, discount, tax, and total from line items and rate percentages.
 * Never stores totals directly in state; always derived dynamically.
 *
 * @param items Array of line items
 * @param discount Discount percentage (e.g., 10 for 10%)
 * @param taxRate Tax rate percentage (e.g., 7.5 for 7.5%)
 */
export function calculateTotals(
  items: LineItem[] = [],
  discount: number = 0,
  taxRate: number = 0
): InvoiceTotals {
  // Safe sanitize inputs
  const safeDiscount = Math.max(0, Math.min(100, Number(discount) || 0));
  const safeTaxRate = Math.max(0, Number(taxRate) || 0);

  // Subtotal: sum of positive (quantity * unitPrice)
  const subtotal = items.reduce((acc, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return acc + qty * price;
  }, 0);

  // Discount amount: discount percentage applied to subtotal
  const discountAmount = Math.round(subtotal * (safeDiscount / 100) * 100) / 100;

  // Taxable amount: subtotal minus discount
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // Tax amount: tax rate applied to taxable amount
  const taxAmount = Math.round(taxableAmount * (safeTaxRate / 100) * 100) / 100;

  // Total
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
}
