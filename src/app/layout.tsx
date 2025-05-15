import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paid Activity Log',
  description: 'Usage tracking and billing component',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
