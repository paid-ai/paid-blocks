<div align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./assets/paid_light.svg" width=600>
        <source media="(prefers-color-scheme: light)" srcset="./assets/paid_dark.svg" width=600>
        <img alt="Fallback image description" src="./assets/paid_light.svg" width=600>
    </picture>
</div>


# Paid.ai Blocks
 
Easily embed Paid.ai blocks in your Next.js app to display payments, invoices, and activity logs for specific customers.

## Quick Setup

1. **Install**: `npm install @agentpaid/paid-nextjs-client`
2. **Add API key**: Set `PAID_API_KEY` in your `.env.local`
3. **Create one API route**: `src/app/api/[paidEndpoint]/[...params]/route.ts`
4. **Use components**: Import and use `PaidContainer` or individual blocks

That's it! No complex configuration needed.

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
import { 
  PaidContainer, 
  PaidActivityLog, 
  PaidInvoiceTable, 
  PaidPaymentsTable 
} from '@agentpaid/paid-nextjs-client';

<PaidContainer 
  title="Customer Overview"
  description="Here's a breakdown of recent activity for your customer."
  defaultActiveTab="payments"
  tabs={[
    {
      id: 'payments',
      label: 'Payments',
      component: <PaidPaymentsTable customerExternalId="customer_123" />
    },
    {
      id: 'invoices', 
      label: 'Invoices',
      component: <PaidInvoiceTable customerExternalId="customer_123" />
    },
    {
      id: 'activity-log',
      label: 'Activity Log', 
      component: <PaidActivityLog customerExternalId="customer_123" />
    }
  ]}
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
<PaidPaymentsTable customerExternalId="customer_123" />

// Invoices only  
<PaidInvoiceTable customerExternalId="customer_123" />

// Activity log only
<PaidActivityLog customerExternalId="customer_123" />
```

---

## API Routes Setup

You need to create a single API route to handle all Paid.ai endpoints. **First, add your Paid.ai API key to `.env.local`:**

```env
PAID_API_KEY=your_paid_ai_api_key_here
```

### Single Unified API Route

Create one API route that handles all four endpoints:

```bash
mkdir -p "app/api/[paidEndpoint]/[...params]" && touch "app/api/[paidEndpoint]/[...params]/route.ts"
```

Add to `app/api/[paidEndpoint]/[...params]/route.ts`:
```ts
import { handleBlocks } from '@agentpaid/paid-nextjs-client';

export const GET = handleBlocks();
```

---

## Complete Example

```tsx
import { 
  PaidContainer,
  PaidActivityLog,
  PaidInvoiceTable,
  PaidPaymentsTable
} from '@agentpaid/paid-nextjs-client';

export default function CustomerDashboard() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Customer Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <p><strong>Welcome back!</strong></p>
        <p>Here's a complete overview for customer <code>customer_123</code>.</p>
      </section>

      <PaidContainer 
        title="Customer Overview"
        description="Complete breakdown of payments, invoices, and activity."
        defaultActiveTab="payments"
        tabs={[
          {
            id: 'payments',
            label: 'Payments',
            component: <PaidPaymentsTable customerExternalId="customer_123" />
          },
          {
            id: 'invoices',
            label: 'Invoices', 
            component: <PaidInvoiceTable customerExternalId="customer_123" />
          },
          {
            id: 'activity-log',
            label: 'Activity Log',
            component: <PaidActivityLog customerExternalId="customer_123" />
          }
        ]}
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
  title="Customer Overview"
  description="Dark theme example"
  defaultActiveTab="payments"
  tabs={[
    {
      id: 'payments',
      label: 'Payments',
      component: <PaidPaymentsTable customerExternalId="customer_123" />
    }
  ]}
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
  customerExternalId="customer_123"
  paidStyle={{
    primaryColor: '#dc2626',
    buttonBgColor: '#fef2f2',
    tableHoverColor: '#fee2e2'
  }}
/>
```
