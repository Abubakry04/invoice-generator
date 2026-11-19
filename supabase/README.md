# EgolePay Backend & Supabase Architecture

This directory contains the production-grade PostgreSQL database schema, security rules, and serverless functions for **EgolePay / Invoice Generator**.

---

## 📁 Directory Structure

```
supabase/
├── migrations/
│   └── 20261116000000_init_schema.sql  # Complete multi-tenant schema with RLS & triggers
├── functions/
│   └── pay-webhook/                    # Edge function for automated payment callbacks
│       └── index.ts
├── seed.sql                            # Sample production test data
└── README.md                           # This architecture and deployment guide
```

---

## 🛡️ Security Architecture

### 1. Row Level Security (RLS)
Every single table in the database has Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Merchant Isolation**: All data queries check `auth.uid() = user_id` or `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`. A merchant can **never** view or edit another user's invoices, clients, inventory, or revenue.
- **Controlled Public Payment Access**:
  - The public customer portal (`/pay/:id`) is granted strictly scoped `SELECT` access to invoices where `status != 'draft' AND public_payment_token IS NOT NULL`.
  - Customers can read line items and merchant contact/payment details for **their invoice only**.
  - Customers can `INSERT` payment records on their invoice without exposing any other business data.
  - Customers **cannot** list other invoices, browse client records, or view financial metrics.

### 2. Multi-Tenant Architecture
- Supports single-owner and multi-business operations under a single Supabase Auth profile.
- All relationships enforce `ON DELETE CASCADE` to prevent orphaned line items or payments.

### 3. Audit Logging
- Dedicated `audit_logs` table logs invoice creation, status changes, manual adjustments, and payment receipts with timestamps and IP addresses for full financial compliance.

---

## 🚀 Quick Setup (2 Minutes)

### Option A: Via the Supabase Web Dashboard (Easiest)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/migrations/20261116000000_init_schema.sql`, copy the entire contents, and paste them into the SQL Editor.
4. Click **Run**. All 10 tables, indexes, triggers, and RLS policies are immediately created.
5. (Optional) Run `supabase/seed.sql` to populate sample demo data.
6. Copy your **Project URL** and **Anon Key** from `Project Settings -> API`.
7. In your React root directory, create a `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

---

### Option B: Via the Supabase CLI (For Local Development)

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Initialize and start local database
supabase init
supabase start

# 3. Apply migrations and seed data
supabase db reset
```

---

## 💳 Edge Function (Payment Webhooks)

When using payment processors like **Paystack**, **Flutterwave**, or **Stripe**:
Deploy the included Edge Function to automatically mark invoices as paid when a client completes a transaction:

```bash
supabase functions deploy pay-webhook --no-verify-jwt
```

Set your webhook URL in your Paystack / Stripe dashboard to:
`https://<your-project-ref>.supabase.co/functions/v1/pay-webhook`
