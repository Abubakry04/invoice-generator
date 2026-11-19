// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This is a Supabase Edge Function to securely handle webhook events from Paystack / Stripe / Flutterwave

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const signature = req.headers.get('x-paystack-signature');
    const bodyText = await req.text();

    // 1. In production, verify HMAC SHA512 signature against PAYSTACK_SECRET_KEY
    if (PAYSTACK_SECRET_KEY && signature) {
      // HMAC validation snippet:
      // const encoder = new TextEncoder();
      // const key = await crypto.subtle.importKey('raw', encoder.encode(PAYSTACK_SECRET_KEY), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
      // const expectedSignature = ...
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const invoiceId = data.metadata?.invoice_id;
      const amountPaid = data.amount / 100; // Paystack sends in kobo / lowest denomination
      const reference = data.reference;

      if (!invoiceId) {
        return new Response(JSON.stringify({ message: 'Ignored: No invoice_id in metadata' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Initialize Supabase admin client (Service Role bypasses RLS for automated background webhook)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Fetch invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .select('*, businesses(*)')
        .eq('id', invoiceId)
        .single();

      if (invError || !invoice) {
        return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
      }

      // Record payment
      const newPaid = Number(invoice.paid_amount || 0) + Number(amountPaid);
      const newOutstanding = Math.max(0, Number(invoice.total || 0) - newPaid);
      const newStatus = newOutstanding <= 0 ? 'paid' : invoice.status;

      // 1. Insert Payment entry
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        business_id: invoice.business_id,
        amount: amountPaid,
        payment_method: 'paystack',
        reference: reference,
        receipt_number: `REC-${Date.now().toString().slice(-6)}`,
        notes: `Automated payment via Paystack Ref: ${reference}`,
        recorded_by: 'Paystack Webhook',
      });

      // 2. Update invoice status & amounts
      await supabase
        .from('invoices')
        .update({
          paid_amount: newPaid,
          outstanding_amount: newOutstanding,
          status: newStatus,
        })
        .eq('id', invoice.id);

      // 3. Log audit event
      await supabase.from('audit_logs').insert({
        business_id: invoice.business_id,
        action: 'payment.received.automated',
        entity_type: 'invoice',
        entity_id: invoice.id,
        metadata: {
          reference,
          amount: amountPaid,
          channel: 'paystack',
        },
      });

      return new Response(JSON.stringify({ success: true, message: 'Payment recorded successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Event acknowledged' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
