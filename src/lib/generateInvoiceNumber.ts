/**
 * Generates the next sequential invoice number formatted with prefix and zero-padding
 * Example: 'INV-0001', 'INV-0002', etc.
 */
export function generateInvoiceNumber(existingNumbers: string[] = [], prefix: string = 'INV-'): string {
  const cleanPrefix = prefix.trim();
  let maxSeq = 0;

  const escapedPrefix = cleanPrefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');

  for (const num of existingNumbers) {
    if (!num) continue;
    const match = num.trim().match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${cleanPrefix}${padded}`;
}
