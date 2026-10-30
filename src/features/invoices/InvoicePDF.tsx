import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Invoice } from '../../types';
import { calculateTotals } from '../../lib/calculateTotals';
import { formatPdfCurrency } from '../../lib/formatCurrency';
import { formatDate } from '../../lib/dates';

interface InvoicePDFProps {
  invoice: Invoice;
  accentColor?: string;
  template?: 'modern' | 'classic' | 'minimal';
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    lineHeight: 1.4,
  },
  // Table base styles
  table: {
    width: '100%',
    marginVertical: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },

  // Summary section
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 16,
  },
  notesBox: {
    flex: 3,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalsBox: {
    flex: 2,
    gap: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  accentColor = '#FF7916',
  template = 'modern',
}) => {
  const totals = calculateTotals(invoice.items, invoice.discount, invoice.taxRate);
  const color = invoice.accentColor || accentColor;
  const activeTemplate = invoice.template || template;

  return (
    <Document title={`Invoice-${invoice.number}`} author={invoice.business.name}>
      <Page size="A4" style={styles.page}>
        {/* ================= MODERN TEMPLATE ================= */}
        {activeTemplate === 'modern' && (
          <View>
            {/* Header Banner */}
            <View
              style={{
                backgroundColor: color,
                borderRadius: 8,
                padding: 18,
                color: '#ffffff',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {invoice.business.logo ? (
                  <Image
                    src={invoice.business.logo}
                    style={{
                      height: 38,
                      width: 100,
                      objectFit: 'contain',
                      backgroundColor: '#ffffff',
                      borderRadius: 4,
                      padding: 2,
                    }}
                  />
                ) : null}
                <View>
                  <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>
                    {invoice.business.name}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#e2e8f0', marginTop: 2 }}>
                    {invoice.business.email}
                  </Text>
                </View>
              </View>

              <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: '#e2e8f0', letterSpacing: 1 }}>INVOICE</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 2 }}>
                  {invoice.number}
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 7, color: '#ffffff', textTransform: 'uppercase' }}>
                    Status: {invoice.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Addresses & Dates */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                  BILLED FROM
                </Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{invoice.business.name}</Text>
                <Text style={{ color: '#475569', fontSize: 8, marginTop: 2 }}>{invoice.business.address}</Text>
                {invoice.business.phone ? (
                  <Text style={{ color: '#475569', fontSize: 8 }}>{invoice.business.phone}</Text>
                ) : null}
              </View>

              <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <Text style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
                  BILLED TO
                </Text>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>{invoice.client.name}</Text>
                <Text style={{ color: '#475569', fontSize: 8, marginTop: 2 }}>{invoice.client.address}</Text>
                {invoice.client.email ? (
                  <Text style={{ color: '#475569', fontSize: 8 }}>{invoice.client.email}</Text>
                ) : null}
              </View>

              <View style={{ flex: 1, textAlign: 'right', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold' }}>ISSUE DATE</Text>
                <Text style={{ fontSize: 8, marginBottom: 6 }}>{formatDate(invoice.issueDate)}</Text>
                <Text style={{ fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold' }}>DUE DATE</Text>
                <Text style={{ fontSize: 8 }}>{formatDate(invoice.dueDate)}</Text>
              </View>
            </View>

            {/* Items Table */}
            <View style={[styles.table, { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6 }]}>
              <View style={[styles.tableHeaderRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.colDesc, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Item Description</Text>
                <Text style={[styles.colQty, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Qty</Text>
                <Text style={[styles.colPrice, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Unit Price</Text>
                <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Total</Text>
              </View>

              {invoice.items.map((item, idx) => {
                const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <View key={item.id || idx} style={styles.tableRow}>
                    <Text style={styles.colDesc}>{item.description}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colPrice}>{formatPdfCurrency(item.unitPrice, invoice.currency)}</Text>
                    <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                      {formatPdfCurrency(itemTotal, invoice.currency)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Totals & Notes */}
            <View style={styles.summaryContainer}>
              <View style={styles.notesBox}>
                {invoice.notes ? (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 2 }}>
                      NOTES & TERMS:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#334155' }}>{invoice.notes}</Text>
                  </View>
                ) : null}
                {invoice.business.bankDetails ? (
                  <View>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 2 }}>
                      PAYMENT INSTRUCTIONS:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#334155' }}>{invoice.business.bankDetails}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={{ color: '#64748b' }}>Subtotal:</Text>
                  <Text>{formatPdfCurrency(totals.subtotal, invoice.currency)}</Text>
                </View>
                {totals.discountAmount > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#059669' }}>Discount ({invoice.discount}%):</Text>
                    <Text style={{ color: '#059669' }}>
                      -{formatPdfCurrency(totals.discountAmount, invoice.currency)}
                    </Text>
                  </View>
                )}
                {invoice.taxRate > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#64748b' }}>Tax / VAT ({invoice.taxRate}%):</Text>
                    <Text>+{formatPdfCurrency(totals.taxAmount, invoice.currency)}</Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    backgroundColor: color,
                    padding: 8,
                    borderRadius: 6,
                    color: '#ffffff',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontFamily: 'Helvetica-Bold', color: '#ffffff' }}>Total Due:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#ffffff' }}>
                    {formatPdfCurrency(totals.total, invoice.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= CLASSIC TEMPLATE ================= */}
        {activeTemplate === 'classic' && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottomWidth: 2,
                borderBottomColor: color,
                marginBottom: 16,
              }}
            >
              <View>
                {invoice.business.logo ? (
                  <Image
                    src={invoice.business.logo}
                    style={{ height: 35, width: 110, objectFit: 'contain', marginBottom: 6 }}
                  />
                ) : null}
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}>{invoice.business.name}</Text>
                <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{invoice.business.address}</Text>
                <Text style={{ fontSize: 8, color: '#475569' }}>
                  {invoice.business.email} {invoice.business.phone ? `• ${invoice.business.phone}` : ''}
                </Text>
              </View>

              <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold', color }}>INVOICE</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{invoice.number}</Text>
                <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
                  Date: {formatDate(invoice.issueDate)}
                </Text>
                <Text style={{ fontSize: 8, color: '#64748b' }}>
                  Due: {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>

            {/* Bill To */}
            <View
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                padding: 10,
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', marginBottom: 2 }}>
                INVOICE RECIPIENT (BILL TO):
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{invoice.client.name}</Text>
              <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{invoice.client.address}</Text>
              {invoice.client.email ? (
                <Text style={{ fontSize: 8, color: '#475569' }}>{invoice.client.email}</Text>
              ) : null}
            </View>

            {/* Table with borders */}
            <View style={[styles.table, { borderWidth: 1, borderColor: '#cbd5e1' }]}>
              <View style={[styles.tableHeaderRow, { backgroundColor: '#f1f5f9' }]}>
                <Text style={[styles.colDesc, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Description</Text>
                <Text style={[styles.colQty, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Qty</Text>
                <Text style={[styles.colPrice, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Rate</Text>
                <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Total</Text>
              </View>

              {invoice.items.map((item, idx) => {
                const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <View key={item.id || idx} style={styles.tableRow}>
                    <Text style={styles.colDesc}>{item.description}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colPrice}>{formatPdfCurrency(item.unitPrice, invoice.currency)}</Text>
                    <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                      {formatPdfCurrency(itemTotal, invoice.currency)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.notesBox}>
                {invoice.business.bankDetails ? (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 2 }}>
                      REMITTANCE / BANK DETAILS:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#334155' }}>{invoice.business.bankDetails}</Text>
                  </View>
                ) : null}
                {invoice.notes ? (
                  <View>
                    <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 2 }}>
                      NOTES:
                    </Text>
                    <Text style={{ fontSize: 8, color: '#334155' }}>{invoice.notes}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={{ color: '#64748b' }}>Subtotal:</Text>
                  <Text>{formatPdfCurrency(totals.subtotal, invoice.currency)}</Text>
                </View>
                {totals.discountAmount > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#059669' }}>Discount ({invoice.discount}%):</Text>
                    <Text style={{ color: '#059669' }}>
                      -{formatPdfCurrency(totals.discountAmount, invoice.currency)}
                    </Text>
                  </View>
                )}
                {invoice.taxRate > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#64748b' }}>VAT / Tax ({invoice.taxRate}%):</Text>
                    <Text>+{formatPdfCurrency(totals.taxAmount, invoice.currency)}</Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: color,
                    paddingVertical: 5,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>Total:</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color }}>
                    {formatPdfCurrency(totals.total, invoice.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= MINIMAL TEMPLATE ================= */}
        {activeTemplate === 'minimal' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <View>
                {invoice.business.logo ? (
                  <Image
                    src={invoice.business.logo}
                    style={{ height: 32, width: 100, objectFit: 'contain', marginBottom: 8 }}
                  />
                ) : null}
                <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold' }}>{invoice.business.name}</Text>
                <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{invoice.business.address}</Text>
                <Text style={{ fontSize: 8, color: '#64748b' }}>{invoice.business.email}</Text>
              </View>

              <View style={{ textAlign: 'right', alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: '#94a3b8', letterSpacing: 1 }}>INVOICE</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{invoice.number}</Text>
                <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
                  Issued: {formatDate(invoice.issueDate)}
                </Text>
                <Text style={{ fontSize: 8, color: '#334155', fontFamily: 'Helvetica-Bold' }}>
                  Due: {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>

            {/* Bill To */}
            <View style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginBottom: 14 }}>
              <Text style={{ fontSize: 7, color: '#94a3b8', letterSpacing: 1, marginBottom: 2 }}>CLIENT</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{invoice.client.name}</Text>
              <Text style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{invoice.client.address}</Text>
              {invoice.client.email ? (
                <Text style={{ fontSize: 8, color: '#64748b' }}>{invoice.client.email}</Text>
              ) : null}
            </View>

            {/* Minimal Table */}
            <View style={styles.table}>
              <View
                style={[
                  styles.tableHeaderRow,
                  { borderBottomWidth: 1, borderBottomColor: '#0f172a', paddingHorizontal: 0 },
                ]}
              >
                <Text style={[styles.colDesc, { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#0f172a' }]}>
                  DESCRIPTION
                </Text>
                <Text style={[styles.colQty, { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#0f172a' }]}>
                  QTY
                </Text>
                <Text style={[styles.colPrice, { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#0f172a' }]}>
                  PRICE
                </Text>
                <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#0f172a' }]}>
                  TOTAL
                </Text>
              </View>

              {invoice.items.map((item, idx) => {
                const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <View key={item.id || idx} style={[styles.tableRow, { paddingHorizontal: 0 }]}>
                    <Text style={styles.colDesc}>{item.description}</Text>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colPrice}>{formatPdfCurrency(item.unitPrice, invoice.currency)}</Text>
                    <Text style={[styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                      {formatPdfCurrency(itemTotal, invoice.currency)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Minimal Totals */}
            <View style={[styles.summaryContainer, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 }]}>
              <View style={{ flex: 3 }}>
                {invoice.business.bankDetails ? (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 7, color: '#94a3b8', letterSpacing: 1, marginBottom: 2 }}>
                      BANK DETAILS
                    </Text>
                    <Text style={{ fontSize: 8, color: '#475569' }}>{invoice.business.bankDetails}</Text>
                  </View>
                ) : null}
                {invoice.notes ? (
                  <View>
                    <Text style={{ fontSize: 7, color: '#94a3b8', letterSpacing: 1, marginBottom: 2 }}>NOTES</Text>
                    <Text style={{ fontSize: 8, color: '#475569' }}>{invoice.notes}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={{ color: '#64748b' }}>Subtotal</Text>
                  <Text>{formatPdfCurrency(totals.subtotal, invoice.currency)}</Text>
                </View>
                {totals.discountAmount > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#059669' }}>Discount ({invoice.discount}%)</Text>
                    <Text style={{ color: '#059669' }}>
                      -{formatPdfCurrency(totals.discountAmount, invoice.currency)}
                    </Text>
                  </View>
                )}
                {invoice.taxRate > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={{ color: '#64748b' }}>Tax ({invoice.taxRate}%)</Text>
                    <Text>+{formatPdfCurrency(totals.taxAmount, invoice.currency)}</Text>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 1,
                    borderTopColor: '#0f172a',
                    paddingTop: 6,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10 }}>Total</Text>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color }}>
                    {formatPdfCurrency(totals.total, invoice.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Global Footer */}
        <View
          style={{
            position: 'absolute',
            bottom: 24,
            left: 36,
            right: 36,
            textAlign: 'center',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            paddingTop: 8,
          }}
        >
          <Text style={{ fontSize: 7, color: '#94a3b8' }}>
            Generated via Egolepay • {invoice.business.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
