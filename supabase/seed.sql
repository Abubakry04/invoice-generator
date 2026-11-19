-- ==============================================================================
-- EgolePay / Invoice Generator - Supabase Seed Data
-- Run this in your Supabase SQL Editor to populate test data
-- ==============================================================================

-- 1. Create a demo user profile in auth.users (if using local development)
-- On Supabase Cloud, sign up an account in the dashboard, and use that user's UUID below.
DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    biz_id UUID;
    client_tech UUID;
    client_design UUID;
    product_web UUID;
    product_retainer UUID;
    inv_1 UUID;
    inv_2 UUID;
BEGIN
    -- Ensure Profile exists
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        demo_user_id,
        'alex@egolepay.io',
        'Alex Morgan',
        'owner'
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- Ensure Subscription exists
    INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle)
    VALUES (demo_user_id, 'growth', 'active', 'monthly')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Insert Business
    INSERT INTO public.businesses (
        id,
        user_id,
        name,
        email,
        phone,
        address,
        tax_id,
        default_currency,
        default_tax_rate,
        default_payment_terms_days,
        invoice_prefix,
        accent_color,
        bank_account_name,
        bank_name,
        bank_account_number,
        payment_instructions
    )
    VALUES (
        gen_random_uuid(),
        demo_user_id,
        'Egole Technologies Ltd',
        'billing@egolepay.io',
        '+234 800 123 4567',
        'Victoria Island, Lagos, Nigeria',
        'TIN-9876543210',
        'NGN',
        7.50,
        14,
        'INV-',
        '#FF7916',
        'Egole Technologies Ltd',
        'Zenith Bank',
        '1012345678',
        'Please quote invoice number as transaction narration.'
    )
    RETURNING id INTO biz_id;

    -- 3. Insert Clients
    INSERT INTO public.clients (business_id, user_id, name, email, phone, address, currency)
    VALUES
        (biz_id, demo_user_id, 'Acme Global Ventures', 'finance@acmeglobal.com', '+234 802 345 6789', 'Ikoyi, Lagos', 'NGN')
    RETURNING id INTO client_tech;

    INSERT INTO public.clients (business_id, user_id, name, email, phone, address, currency)
    VALUES
        (biz_id, demo_user_id, 'Starlight Media Studios', 'payments@starlight.io', '+1 415 555 0199', 'San Francisco, CA', 'USD')
    RETURNING id INTO client_design;

    -- 4. Insert Products / Catalog
    INSERT INTO public.products (business_id, user_id, name, description, sku, type, unit_price, category, stock)
    VALUES
        (biz_id, demo_user_id, 'Full-Stack Web Development', 'Custom React & Node.js application sprint', 'SRV-DEV-01', 'service', 850000.00, 'Development', 0)
    RETURNING id INTO product_web;

    INSERT INTO public.products (business_id, user_id, name, description, sku, type, unit_price, category, stock)
    VALUES
        (biz_id, demo_user_id, 'Monthly Cloud Ops Retainer', '24/7 Monitoring and infrastructure maintenance', 'SRV-RET-01', 'service', 350000.00, 'Retainer', 0)
    RETURNING id INTO product_retainer;

    -- 5. Insert Invoices
    INSERT INTO public.invoices (
        business_id,
        user_id,
        client_id,
        number,
        issue_date,
        due_date,
        status,
        currency,
        subtotal,
        discount_value,
        tax_rate,
        total,
        paid_amount,
        outstanding_amount,
        notes
    )
    VALUES (
        biz_id,
        demo_user_id,
        client_tech,
        'INV-0001',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE + INTERVAL '4 days',
        'sent',
        'NGN',
        850000.00,
        0.00,
        7.50,
        913750.00,
        0.00,
        913750.00,
        'Thank you for partnering with Egole Technologies.'
    )
    RETURNING id INTO inv_1;

    INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, amount, sort_order)
    VALUES (inv_1, product_web, 'Full-Stack Web Development - Sprint 1', 1, 850000.00, 850000.00, 0);

    -- Second Invoice (Paid)
    INSERT INTO public.invoices (
        business_id,
        user_id,
        client_id,
        number,
        issue_date,
        due_date,
        status,
        currency,
        subtotal,
        discount_value,
        tax_rate,
        total,
        paid_amount,
        outstanding_amount,
        notes
    )
    VALUES (
        biz_id,
        demo_user_id,
        client_tech,
        'INV-0002',
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE - INTERVAL '16 days',
        'paid',
        'NGN',
        350000.00,
        0.00,
        7.50,
        376250.00,
        376250.00,
        0.00,
        'Monthly retainer for Cloud Ops.'
    )
    RETURNING id INTO inv_2;

    INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, amount, sort_order)
    VALUES (inv_2, product_retainer, 'Monthly Cloud Ops Retainer', 1, 350000.00, 350000.00, 0);

    -- Payment record for INV-0002
    INSERT INTO public.payments (
        invoice_id,
        business_id,
        amount,
        payment_date,
        payment_method,
        reference,
        receipt_number,
        recorded_by
    )
    VALUES (
        inv_2,
        biz_id,
        376250.00,
        CURRENT_DATE - INTERVAL '20 days',
        'bank_transfer',
        'TXN-ZENITH-883921',
        'REC-0001',
        'Admin'
    );

END $$;
