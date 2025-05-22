# Paid Next.js Client SDK
 
Easily embed the Paid.ai Activity Log component in your Next.js app to display agent usage for specific accounts.

---

## Features

- Plug-and-play React component for displaying agent activity logs.
- Designed for Next.js 13+ (App Router).
- Fetches usage data for a given account using your API key.
- Fully customizable and responsive.

---

## Installation

```bash
npm install @agentpaid/paid-nextjs-client
# or
yarn add @agentpaid/paid-nextjs-client
```

---

## Usage

1. **Import the component:**

```tsx
import { PaidActivityLog } from '@agentpaid/paid-nextjs-client';
```

2. **Add it to your page or component:**

```tsx
<PaidActivityLog accountExternalId="your_external_account_id" />
```

- `accountExternalId` (string, required): The customer external ID of the account whose activity you want to display.

---

## API Route Setup

To enable the PaidActivityLog component, you must create an API route in your Next.js app that proxies requests to Paid.ai using your API key.

**You must also create a `.env.local` file in your project root and add your Paid.ai API key:**

```env
PAID_API_KEY=your_paid_ai_api_key_here
```

**Run this command to generate the required directory and file:**

```bash
mkdir -p "src/app/api/usage/[accountExternalId]" && touch "src/app/api/usage/[accountExternalId]/route.ts"
```

**Then, add the following code to `src/app/api/usage/[accountExternalId]/route.ts`:**

```ts
import { handlePaidUsage } from '@agentpaid/paid-nextjs-client';

export const GET = handlePaidUsage(process.env.PAID_API_KEY!);
```

This will securely proxy usage requests to Paid.ai using your API key from environment variables.

---

## Example

```tsx
import { PaidActivityLog } from '@agentpaid/paid-nextjs-client';

export default function AgentDashboard() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Agent Dashboard</h1>

      <section style={{ marginBottom: '2rem' }}>
        <p><strong>Welcome back!</strong></p>
        <p>Here’s a breakdown of recent activity for account <code>customer_123</code>.</p>
      </section>

      <PaidActivityLog accountExternalId="customer_123" />

      <section style={{ marginTop: '2rem' }}>
        <p>Need help? Visit our <a href="/support">support center</a>.</p>
      </section>
    </div>
  );
}
```

---

## Styling & Customization

The `PaidActivityLog` component is fully customizable through the `paidStyle` prop. You can override the visual design of the component, such as fonts, colors, borders, and layout, by passing an object with our predefined styling variables.

These custom CSS properties map directly to visual elements inside the component and allow full control over typography, layout, and colors without modifying any stylesheets.

## Example

```html
<PaidActivityLog 
  accountExternalId="customer_123" 
  paidStyle={{
    paidTitleColor: '#ff0000',
    paidTitleFontWeight: 'bold',
    paidFontFamily: 'Comic Sans MS, Comic Sans, sans-serif',
    paidWrapperBorder: 'none',
    paidHeaderBorderBottom: 'none',
    paidThBorderBottom: 'none',
    paidTdBorderBottom: 'none',
    paidTdColor: '#00ff00',
    paidTdBg: '#0000ff',
    paidRowHoverBg: '#000000',
  }}
/>
```

## Available Style Variables

| Variable Name | CSS Custom Property | Description |
| --- | --- | --- |
| `paidFontFamily` | `--paid-font-family` | Global font for all content |
| `paidTitleFontSize` | `--paid-title-font-size` | Title font size |
| `paidTitleFontWeight` | `--paid-title-font-weight` | Title font weight |
| `paidTitleColor` | `--paid-title-color` | Title color |
| `paidToggleFontSize` | `--paid-toggle-font-size` | Toggle font size |
| `paidToggleFontWeight` | `--paid-toggle-font-weight` | Toggle font weight |
| `paidToggleColor` | `--paid-toggle-color` | Toggle color |
| `paidThFontSize` | `--paid-th-font-size` | Table header font size |
| `paidThFontWeight` | `--paid-th-font-weight` | Table header font weight |
| `paidThColor` | `--paid-th-color` | Table header text color |
| `paidTdFontSize` | `--paid-td-font-size` | Table data font size |
| `paidTdFontWeight` | `--paid-td-font-weight` | Table data font weight |
| `paidTdColor` | `--paid-td-color` | Table data text color |
| `paidEmptyColor` | `--paid-empty-color` | “No usage data” message color |
| `paidWrapperBg` | `--paid-wrapper-bg` | Outer wrapper background |
| `paidWrapperBorder` | `--paid-wrapper-border` | Outer wrapper border |
| `paidHeaderBg` | `--paid-header-bg` | Header bar background |
| `paidHeaderBorderBottom` | `--paid-header-border-bottom` | Header bottom border |
| `paidTableBg` | `--paid-table-bg` | Table background |
| `paidThBg` | `--paid-th-bg` | Header cell background |
| `paidThBorderBottom` | `--paid-th-border-bottom` | Header cell bottom border |
| `paidTdBg` | `--paid-td-bg` | Data cell background |
| `paidTdBorderBottom` | `--paid-td-border-bottom` | Data cell bottom border |
| `paidRowHoverBg` | `--paid-row-hover-bg` | Data row hover background |

