import { InvoiceStatus } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a future date formatted as YYYY-MM-DD (defaults to +14 days)
 */
export function getDefaultDueDate(daysAhead: number = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly format e.g. "19 Oct 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Determines whether an invoice's due date has passed without being paid
 */
export function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  if (status === 'paid') return false;
  if (!dueDate) return false;

  const today = getTodayDateString();
  return dueDate < today;
}

/**
 * Computes the effective visual status of an invoice.
 * If status is not 'paid' and due date has passed, returns 'overdue'.
 */
export function getEffectiveStatus(invoice: { status: InvoiceStatus; dueDate: string }): InvoiceStatus {
  if (invoice.status === 'paid') return 'paid';
  if (isOverdue(invoice.dueDate, invoice.status)) {
    return 'overdue';
  }
  return invoice.status;
}
