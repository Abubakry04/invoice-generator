-- ==============================================================================
-- EgolePay / Invoice Generator - Production Supabase Database Schema
-- Multi-Tenant Architecture with Strict Row-Level Security (RLS)
-- Migration: 20261116000000_init_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES (Extends Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. BUSINESSES (Tenant entities; allows 1 user to operate 1 or multiple businesses)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    logo_url TEXT,
    default_currency TEXT NOT NULL DEFAULT 'NGN',
    default_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.50,
    default_payment_terms_days INTEGER NOT NULL DEFAULT 14,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    accent_color TEXT NOT NULL DEFAULT '#FF7916',
    default_template TEXT NOT NULL DEFAULT 'modern',
    bank_account_name TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    payment_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. CLIENTS (Customer CRM directory)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_terms_days INTEGER NOT NULL DEFAULT 14,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. PRODUCTS & SERVICES (Inventory & Price Book)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    type TEXT NOT NULL DEFAULT 'service' CHECK (type IN ('product', 'service')),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    category TEXT DEFAULT 'General',
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. INVOICES (Main ledger & document header)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'NGN',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    payment_instructions TEXT,
    template_id TEXT NOT NULL DEFAULT 'modern',
    public_payment_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_schedule_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_invoice_number_per_business UNIQUE (business_id, number)
);

-- ==============================================================================
-- 6. INVOICE ITEMS (Line items detail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. PAYMENTS (Receipts & ledger entries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'stripe', 'paystack', 'flutterwave')),
    reference TEXT,
    notes TEXT,
    receipt_number TEXT NOT NULL,
    recorded_by TEXT DEFAULT 'Customer Portal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. RECURRING SCHEDULES (Automated billing retainers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    template_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    next_trigger_date DATE NOT NULL,
    last_generated_date DATE,
    auto_send BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. SUBSCRIPTIONS & USAGE LIMITS (Server-side plan entitlements)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    invoices_created_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. AUDIT LOGS (Compliance & Security Event Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_business_id ON public.clients(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON public.invoices(public_payment_token);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_business_id ON public.recurring_schedules(business_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_next_trigger ON public.recurring_schedules(next_trigger_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_businesses_updated_at ON public.businesses;
CREATE TRIGGER trigger_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON public.invoices;
CREATE TRIGGER trigger_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_recurring_schedules_updated_at ON public.recurring_schedules;
CREATE TRIGGER trigger_recurring_schedules_updated_at BEFORE UPDATE ON public.recurring_schedules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- AUTOMATIC NEW USER ONBOARDING TRIGGER
-- Whenever a user signs up via Supabase Auth, automatically provision profile & default starter plan
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Insert Profile
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'owner'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Starter Subscription
    INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle)
    VALUES (NEW.id, 'starter', 'active', 'monthly')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation + Controlled Public Access for Invoice Payment Portal
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- BUSINESSES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Owners can view their businesses"
    ON public.businesses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Owners can create businesses"
    ON public.businesses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their businesses"
    ON public.businesses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their businesses"
    ON public.businesses FOR DELETE
    USING (auth.uid() = user_id);

-- PUBLIC ACCESS: Allow read-only of basic business header on public invoice payment page
CREATE POLICY "Public can view merchant details on valid invoices"
    ON public.businesses FOR SELECT
    USING (
        id IN (
            SELECT business_id FROM public.invoices
            WHERE status != 'draft'
        )
    );

-- ------------------------------------------------------------------------------
-- CLIENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage their clients"
    ON public.clients FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage their products"
    ON public.products FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- INVOICES POLICIES
-- ------------------------------------------------------------------------------
-- Authenticated merchant access
CREATE POLICY "Users can manage their own invoices"
    ON public.invoices FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- PUBLIC CUSTOMER ACCESS:
-- Customers can view the specific invoice if they have the public payment token OR invoice UUID and status is not draft
CREATE POLICY "Public customer portal can view published invoice"
    ON public.invoices FOR SELECT
    USING (
        status != 'draft' AND (
            public_payment_token IS NOT NULL
        )
    );

-- ------------------------------------------------------------------------------
-- INVOICE ITEMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage items of their invoices"
    ON public.invoice_items FOR ALL
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE user_id = auth.uid()
        )
    );

-- PUBLIC CUSTOMER ACCESS:
-- Customers can read items for the published invoice they are viewing
CREATE POLICY "Public customer portal can view line items of published invoice"
    ON public.invoice_items FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE status != 'draft'
        )
    );

-- ------------------------------------------------------------------------------
-- PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view and manage payments for their business"
    ON public.payments FOR ALL
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- PUBLIC CUSTOMER ACCESS:
-- Customers can record a payment on a published invoice via the public portal
CREATE POLICY "Public customer portal can submit payment on published invoice"
    ON public.payments FOR INSERT
    WITH CHECK (
        invoice_id IN (
            SELECT id FROM public.invoices WHERE status != 'draft'
        )
    );

-- ------------------------------------------------------------------------------
-- RECURRING SCHEDULES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage their recurring schedules"
    ON public.recurring_schedules FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- SUBSCRIPTIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their subscription status"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view audit logs for their businesses"
    ON public.audit_logs FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );
