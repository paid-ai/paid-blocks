# Paid Next.js Client SDK
 
Easily embed Paid.ai blocks in your Next.js app to display payments, invoices, and activity logs for specific accounts.

---

## Features

- **PaidContainer**: A universal container block with tabbed interface for all data views
- **Individual Blocks**: Standalone blocks for payments, invoices, and activity logs
- **Universal Styling**: Consistent styling system across all blocks
- **Plug-and-play**: Designed for Next.js 13+ (App Router)
- **Fully Responsive**: Works seamlessly across all device sizes

---

## Installation

```bash
npm install @agentpaid/paid-nextjs-client
# or
yarn add @agentpaid/paid-nextjs-client
```

---

## Blocks

### PaidContainer (Recommended)

The `PaidContainer` is an all-in-one tabbed interface that displays payments, invoices, and activity logs in a single block. This is the easiest way to integrate all Paid.ai data views.

```tsx
import { PaidContainer } from '@agentpaid/paid-nextjs-client';

<PaidContainer 
  accountExternalId="customer_123"
  paidStyle={{
    fontFamily: 'Inter',
    primaryColor: '#1f2937',
    containerBackgroundColor: '#f8fafc',
    buttonBgColor: '#3b82f6'
  }}
/>
```

### Individual Blocks

For more granular control, you can use individual blocks:

```tsx
import { 
  PaidPaymentsTable, 
  PaidInvoiceTable, 
  PaidActivityLog 
} from '@agentpaid/paid-nextjs-client';

// Payments only
<PaidPaymentsTable accountExternalId="customer_123" />

// Invoices only  
<PaidInvoiceTable accountExternalId="customer_123" />

// Activity log only
<PaidActivityLog accountExternalId="customer_123" />
```

---

## API Routes Setup

You need to create API routes for each data type. **First, add your Paid.ai API key to `.env.local`:**

```env
PAID_API_KEY=your_paid_ai_api_key_here
```

### Required API Routes

**1. Payments API Route**
```bash
mkdir -p "src/app/api/payments/[accountExternalId]" && touch "src/app/api/payments/[accountExternalId]/route.ts"
```

Add to `src/app/api/payments/[accountExternalId]/route.ts`:
```ts
import { handlePaidPayments } from '@agentpaid/paid-nextjs-client';

export const GET = handlePaidPayments(process.env.PAID_API_KEY!);
```

**2. Invoices API Route**
```bash
mkdir -p "src/app/api/invoices/[accountExternalId]" && touch "src/app/api/invoices/[accountExternalId]/route.ts"
```

Add to `src/app/api/invoices/[accountExternalId]/route.ts`:
```ts
import { handlePaidInvoices } from '@agentpaid/paid-nextjs-client';

export const GET = handlePaidInvoices(process.env.PAID_API_KEY!);
```

**3. Activity Log API Route**
```bash
mkdir -p "src/app/api/usage/[accountExternalId]" && touch "src/app/api/usage/[accountExternalId]/route.ts"
```

Add to `src/app/api/usage/[accountExternalId]/route.ts`:
```ts
import { handlePaidUsage } from '@agentpaid/paid-nextjs-client';

export const GET = handlePaidUsage(process.env.PAID_API_KEY!);
```

---

## Complete Example

```tsx
import { PaidContainer } from '@agentpaid/paid-nextjs-client';

export default function CustomerDashboard() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Customer Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <p><strong>Welcome back!</strong></p>
        <p>Here's a complete overview for account <code>customer_123</code>.</p>
      </section>

      <PaidContainer 
        accountExternalId="customer_123"
        paidStyle={{
          // Global styling
          fontFamily: 'Inter, sans-serif',
          primaryColor: '#1f2937',
          secondaryColor: '#6b7280',
          
          // Container & backgrounds
          containerBackgroundColor: '#f8fafc',
          tableBackgroundColor: '#ffffff',
          tableHeaderBackgroundColor: '#f1f5f9',
          
          // Tabs
          tabBackgroundColor: '#e2e8f0',
          tabActiveBackgroundColor: '#3b82f6',
          tabHoverBackgroundColor: '#cbd5e1',
          
          // Interactive elements
          tableHoverColor: '#f1f5f9',
          buttonBgColor: '#3b82f6'
        }}
      />

      <section style={{ marginTop: '2rem' }}>
        <p>Need help? Visit our <a href="/support">support center</a>.</p>
      </section>
    </div>
  );
}
```

---

## Styling System

The Paid.ai blocks use a simplified, universal styling system. All blocks accept a `paidStyle` prop with the following properties:

### Universal Style Properties

| Property | Description | Default |
|----------|-------------|---------|
| `fontFamily` | Global font family for all text | `'Roboto'` |
| `primaryColor` | Primary text color | `'#374151'` |
| `secondaryColor` | Secondary text color | `'#6b7280'` |
| `containerBackgroundColor` | Main container background | `'#f8f9fa'` |
| `tableBackgroundColor` | Table body background | `'#ffffff'` |
| `tableHeaderBackgroundColor` | Table header background | `'#f9fafb'` |
| `tabBackgroundColor` | Tab background (PaidContainer only) | `'#e2e8f0'` |
| `tabActiveBackgroundColor` | Active tab background | `'#3b82f6'` |
| `tabHoverBackgroundColor` | Tab hover background | `'#cbd5e1'` |
| `tableHoverColor` | Table row hover background | `'#f3f4f6'` |
| `buttonBgColor` | Background for buttons, status badges, and pagination | `'#ffffff'` |

### Styling Inheritance

- **PaidContainer**: Styles applied here automatically inherit to all child blocks
- **Individual Blocks**: Can override inherited styles or define their own when used standalone
- **Flexible**: Mix and match - style globally via PaidContainer or individually per block

### Example: Dark Theme

```tsx
<PaidContainer 
  accountExternalId="customer_123"
  paidStyle={{
    fontFamily: 'Inter',
    primaryColor: '#f9fafb',
    secondaryColor: '#d1d5db',
    containerBackgroundColor: '#1f2937',
    tableBackgroundColor: '#374151',
    tableHeaderBackgroundColor: '#4b5563',
    tabBackgroundColor: '#4b5563',
    tabActiveBackgroundColor: '#3b82f6',
    tabHoverBackgroundColor: '#6b7280',
    tableHoverColor: '#4b5563',
    buttonBgColor: '#6b7280'
  }}
/>
```

### Example: Individual Block Styling

```tsx
<PaidPaymentsTable 
  accountExternalId="customer_123"
  paidStyle={{
    primaryColor: '#dc2626',
    buttonBgColor: '#fef2f2',
    tableHoverColor: '#fee2e2'
  }}
/>
```

---

## Props

### PaidContainer

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accountExternalId` | `string` | ✅ | Customer external ID |
| `paidStyle` | `PaidStyleProperties` | ❌ | Styling configuration |

### Individual Blocks

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accountExternalId` | `string` | ✅ | Customer external ID |
| `paidStyle` | `PaidStyleProperties` | ❌ | Styling configuration |

---

## Features

- **Tabbed Interface**: PaidContainer provides easy navigation between data views
- **Pagination**: All tables include built-in pagination for large datasets
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Loading States**: Elegant loading indicators while data fetches
- **Error Handling**: Graceful error messages for failed requests
- **Caching**: Built-in request caching for improved performance
- **PDF Preview**: Invoice table includes PDF preview and download functionality
