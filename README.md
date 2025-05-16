# Paid Next.js Client SDK

**Official Next.js SDK for Paid.ai**  
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

export default function Page() {
  return (
    <div>
      <PaidActivityLog accountExternalId="customer_123" />
    </div>
  );
}
```

