import { Client, Invoice, Settings } from '../types';
import logoImg from '../assets/logo3.png';

export const SAMPLE_LOGO_DATA_URI = logoImg;

export const SAMPLE_SETTINGS: Settings = {
  business: {
    name: 'EgolePay LTD',
    address: '41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria',
    email: 'hello@egolepay.com',
    phone: '+234 913 933 0394',
    bankDetails: 'Guaranty Trust Bank (GTBank)\nAccount Name: EgolePay LTD\nAccount No: 0123456789\nSort Code: 058152062',
    logo: logoImg,
  },
  defaultCurrency: 'NGN',
  defaultTaxRate: 7.5,
  invoicePrefix: 'INV-',
  accentColor: '#FF7916', // Modern vibrant brand orange
  defaultTemplate: 'modern',
};

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'client-001',
    name: 'PayWave Fintech Solutions',
    email: 'contact@paywave.ng',
    address: '5th Floor, Landmark Towers, Water Corporation Rd, Victoria Island, Lagos',
    phone: '+234 810 555 1234',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'client-002',
    name: 'Dangote Logistics Hub',
    email: 'procurement@dangotelogistics.com',
    address: '1 Commercial Avenue, Apapa Port Complex, Lagos',
    phone: '+234 803 111 2233',
    createdAt: '2026-09-10T12:00:00Z',
  },
  {
    id: 'client-003',
    name: 'Eko Retail & Supermarkets',
    email: 'accounts@ekoretail.ng',
    address: '8 Admiralty Way, Lekki Phase 1, Lagos',
    phone: '+234 818 999 0011',
    createdAt: '2026-09-15T15:30:00Z',
  },
];

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'inv-0001',
    number: 'INV-0001',
    issueDate: '2026-10-10',
    dueDate: '2026-10-28',
    currency: 'NGN',
    business: {
      name: 'Egolepay LTD',
      address: '41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria',
      email: 'billing@pulsetech.ng',
      phone: '+234 802 345 6789',
      bankDetails: 'Guaranty Trust Bank (GTBank)\nAccount Name: Egolepay LTD\nAccount No: 0123456789\nSort Code: 058152062',
      logo: SAMPLE_LOGO_DATA_URI,
    },
    client: {
      name: 'PayWave Fintech Solutions',
      email: 'contact@paywave.ng',
      address: '5th Floor, Landmark Towers, Water Corporation Rd, Victoria Island, Lagos',
      phone: '+234 810 555 1234',
    },
    items: [
      {
        id: 'item-101',
        description: 'Mobile Banking App UI/UX Redesign & User Journey Wireframes',
        quantity: 1,
        unitPrice: 1250000,
      },
      {
        id: 'item-102',
        description: 'Figma Design System & Cross-platform React Component Library',
        quantity: 1,
        unitPrice: 450000,
      },
    ],
    discount: 5, // 5% discount
    taxRate: 7.5,
    notes: 'Payment is due within 18 days of issue. Kindly quote invoice number INV-0001 in bank transfer remarks.',
    status: 'sent',
    template: 'modern',
    accentColor: '#FF7916',
  },
  {
    id: 'inv-0002',
    number: 'INV-0002',
    issueDate: '2026-09-15',
    dueDate: '2026-10-01', // Due date passed -> will display as overdue!
    currency: 'NGN',
    business: {
      name: 'Egolepay LTD',
      address: '41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria',
      email: 'billing@pulsetech.ng',
      phone: '+234 802 345 6789',
      bankDetails: 'Guaranty Trust Bank (GTBank)\nAccount Name: Egolepay LTD\nAccount No: 0123456789\nSort Code: 058152062',
      logo: SAMPLE_LOGO_DATA_URI,
    },
    client: {
      name: 'Dangote Logistics Hub',
      email: 'procurement@dangotelogistics.com',
      address: '1 Commercial Avenue, Apapa Port Complex, Lagos',
      phone: '+234 803 111 2233',
    },
    items: [
      {
        id: 'item-201',
        description: 'Fleet Tracking & GPS Telemetry API Integration',
        quantity: 1,
        unitPrice: 2800000,
      },
      {
        id: 'item-202',
        description: 'High-availability AWS Cloud Setup & Load Balancer Configuration',
        quantity: 1,
        unitPrice: 350000,
      },
    ],
    discount: 0,
    taxRate: 7.5,
    notes: 'Please remit payment directly to the specified GTBank corporate account.',
    status: 'sent', // Overdue since dueDate < today
    template: 'classic',
    accentColor: '#0f766e',
  },
  {
    id: 'inv-0003',
    number: 'INV-0003',
    issueDate: '2026-09-20',
    dueDate: '2026-10-05',
    currency: 'NGN',
    business: {
      name: 'Egolepay LTD',
      address: '41, Industrial Avenue, Sabo, Yaba, Lagos, Nigeria',
      email: 'billing@pulsetech.ng',
      phone: '+234 802 345 6789',
      bankDetails: 'Guaranty Trust Bank (GTBank)\nAccount Name: Egolepay LTD\nAccount No: 0123456789\nSort Code: 058152062',
      logo: SAMPLE_LOGO_DATA_URI,
    },
    client: {
      name: 'Eko Retail & Supermarkets',
      email: 'accounts@ekoretail.ng',
      address: '8 Admiralty Way, Lekki Phase 1, Lagos',
      phone: '+234 818 999 0011',
    },
    items: [
      {
        id: 'item-301',
        description: 'Point-of-Sale (POS) Multi-branch Terminal Software License',
        quantity: 3,
        unitPrice: 220000,
      },
      {
        id: 'item-302',
        description: 'Quarterly Dedicated On-site Technical Support & Database Backup',
        quantity: 1,
        unitPrice: 180000,
      },
    ],
    discount: 0,
    taxRate: 7.5,
    notes: 'Paid in full via Electronic Funds Transfer on Oct 4, 2026. Thank you for your business!',
    status: 'paid',
    template: 'minimal',
    accentColor: '#4f46e5',
  },
];
