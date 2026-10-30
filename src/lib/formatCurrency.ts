/**
 * Currency configuration and formatting helpers
 */

const CURRENCY_CONFIG: Record<string, { locale: string; symbol: string; code: string }> = {
  NGN: { locale: 'en-NG', symbol: '₦', code: 'NGN' },
  USD: { locale: 'en-US', symbol: '$', code: 'USD' },
  EUR: { locale: 'de-DE', symbol: '€', code: 'EUR' },
  GBP: { locale: 'en-GB', symbol: '£', code: 'GBP' },
  CAD: { locale: 'en-CA', symbol: 'CA$', code: 'CAD' },
  GHS: { locale: 'en-GH', symbol: 'GH₵', code: 'GHS' },
  KES: { locale: 'en-KE', symbol: 'KSh', code: 'KES' },
  ZAR: { locale: 'en-ZA', symbol: 'R', code: 'ZAR' },
};

export const SUPPORTED_CURRENCIES = [
  { code: 'NGN', label: 'NGN (₦) - Nigerian Naira', symbol: '₦' },
  { code: 'USD', label: 'USD ($) - US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR (€) - Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP (£) - British Pound', symbol: '£' },
  { code: 'CAD', label: 'CAD (CA$) - Canadian Dollar', symbol: 'CA$' },
  { code: 'GHS', label: 'GHS (GH₵) - Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'KES', label: 'KES (KSh) - Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', label: 'ZAR (R) - South African Rand', symbol: 'R' },
];

/**
 * Format monetary amount according to invoice currency using Intl.NumberFormat
 * Defaults to en-NG for NGN as required.
 */
export function formatCurrency(amount: number = 0, currencyCode: string = 'NGN'): string {
  const code = (currencyCode || 'NGN').toUpperCase();
  const config = CURRENCY_CONFIG[code] || { locale: 'en-US', symbol: code, code };

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if browser/platform lacks locale
    return `${config.symbol} ${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * PDF-safe monetary formatting that renders reliably across PDF viewers
 * without relying on system font glyph coverage for non-Latin currency signs.
 */
export function formatPdfCurrency(amount: number = 0, currencyCode: string = 'NGN'): string {
  const code = (currencyCode || 'NGN').toUpperCase();
  const formattedNumber = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (code === 'USD') return `$${formattedNumber}`;
  if (code === 'EUR') return `€${formattedNumber}`;
  if (code === 'GBP') return `£${formattedNumber}`;
  return `${code} ${formattedNumber}`;
}

/**
 * Get currency symbol for quick display
 */
export function getCurrencySymbol(currencyCode: string = 'NGN'): string {
  const code = (currencyCode || 'NGN').toUpperCase();
  return CURRENCY_CONFIG[code]?.symbol || code;
}
