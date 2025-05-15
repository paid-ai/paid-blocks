import { PaidActivityLog } from '../components/PaidActivityLog';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <PaidActivityLog
        accountExternalId="customer_345"
      />
    </main>
  );
}
