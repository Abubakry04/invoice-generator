import { Invoice, Client } from '../types';
import { calculateTotals } from './calculateTotals';
import { getEffectiveStatus } from './dates';

/**
 * Escapes field for CSV (RFC 4180 standard)
 */
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Triggers browser download of a CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete invoices ledger to CSV
 */
export function exportInvoicesToCSV(invoices: Invoice[]): void {
  const headers = [
    'Invoice Number',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Issue Date',
    'Due Date',
    'Status',
    'Currency',
    'Subtotal',
    'Discount (%)',
    'Discount Amount',
    'Tax Rate (%)',
    'Tax Amount',
    'Total Amount',
    'Paid Amount',
    'Balance Due',
    'Payments Logged',
    'Payment Link',
    'Created At',
  ];

  const rows = invoices.map((inv) => {
    const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
    const effStatus = getEffectiveStatus(inv);
    const paid = inv.paidAmount || (effStatus === 'paid' ? totals.total : 0);
    const balance = Math.max(0, totals.total - paid);
    const paymentCount = inv.payments?.length || (paid > 0 ? 1 : 0);

    return [
      escapeCSV(inv.number),
      escapeCSV(inv.client.name),
      escapeCSV(inv.client.email || ''),
      escapeCSV(inv.client.phone || ''),
      escapeCSV(inv.issueDate),
      escapeCSV(inv.dueDate),
      escapeCSV(effStatus.toUpperCase()),
      escapeCSV(inv.currency),
      escapeCSV(totals.subtotal.toFixed(2)),
      escapeCSV(inv.discount),
      escapeCSV(totals.discountAmount.toFixed(2)),
      escapeCSV(inv.taxRate),
      escapeCSV(totals.taxAmount.toFixed(2)),
      escapeCSV(totals.total.toFixed(2)),
      escapeCSV(paid.toFixed(2)),
      escapeCSV(balance.toFixed(2)),
      escapeCSV(paymentCount),
      escapeCSV(inv.paymentLink || ''),
      escapeCSV(inv.createdAt || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`invoices-export-${dateStr}.csv`, csvContent);
}

/**
 * Exports clients directory with aggregated balances to CSV
 */
export function exportClientsToCSV(clients: Client[], invoices: Invoice[]): void {
  const headers = [
    'Client Name',
    'Email Address',
    'Phone',
    'Billing Address',
    'Total Invoices',
    'Total Invoiced Volume',
    'Total Paid',
    'Total Outstanding Balance',
  ];

  const rows = clients.map((c) => {
    const clientInvoices = invoices.filter(
      (inv) =>
        inv.client.name.toLowerCase() === c.name.toLowerCase() ||
        (c.email && inv.client.email.toLowerCase() === c.email.toLowerCase())
    );

    let totalVolume = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const inv of clientInvoices) {
      const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
      const effStatus = getEffectiveStatus(inv);
      const paid = inv.paidAmount || (effStatus === 'paid' ? totals.total : 0);
      totalVolume += totals.total;
      totalPaid += paid;
      totalOutstanding += Math.max(0, totals.total - paid);
    }

    return [
      escapeCSV(c.name),
      escapeCSV(c.email || ''),
      escapeCSV(c.phone || ''),
      escapeCSV(c.address || ''),
      escapeCSV(clientInvoices.length),
      escapeCSV(totalVolume.toFixed(2)),
      escapeCSV(totalPaid.toFixed(2)),
      escapeCSV(totalOutstanding.toFixed(2)),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`customers-export-${dateStr}.csv`, csvContent);
}

/**
 * Exports 12-month aggregated financial statement to CSV
 */
export function exportFinancialStatementCSV(invoices: Invoice[], currency: string): void {
  const months: Record<
    string,
    {
      invoiced: number;
      collected: number;
      outstanding: number;
      overdue: number;
      tax: number;
      count: number;
    }
  > = {};

  for (const inv of invoices) {
    const monthKey = inv.issueDate ? inv.issueDate.slice(0, 7) : 'Unknown';
    if (!months[monthKey]) {
      months[monthKey] = { invoiced: 0, collected: 0, outstanding: 0, overdue: 0, tax: 0, count: 0 };
    }

    const totals = calculateTotals(inv.items, inv.discount, inv.taxRate);
    const effStatus = getEffectiveStatus(inv);
    const paid = inv.paidAmount || (effStatus === 'paid' ? totals.total : 0);
    const balance = Math.max(0, totals.total - paid);

    months[monthKey].invoiced += totals.total;
    months[monthKey].collected += paid;
    months[monthKey].outstanding += balance;
    if (effStatus === 'overdue') {
      months[monthKey].overdue += balance;
    }
    months[monthKey].tax += totals.taxAmount;
    months[monthKey].count += 1;
  }

  const sortedMonths = Object.keys(months).sort().reverse();

  const headers = [
    'Month (YYYY-MM)',
    `Currency (${currency})`,
    'Invoices Count',
    'Total Invoiced',
    'Total Collected (Paid)',
    'Outstanding Balance',
    'Overdue Balance',
    'Tax / VAT Volume',
  ];

  const rows = sortedMonths.map((m) => {
    const data = months[m];
    return [
      escapeCSV(m),
      escapeCSV(currency),
      escapeCSV(data.count),
      escapeCSV(data.invoiced.toFixed(2)),
      escapeCSV(data.collected.toFixed(2)),
      escapeCSV(data.outstanding.toFixed(2)),
      escapeCSV(data.overdue.toFixed(2)),
      escapeCSV(data.tax.toFixed(2)),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`financial-summary-${dateStr}.csv`, csvContent);
}

