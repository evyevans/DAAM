import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DAAM — Document operations',
  description: 'Document, Automated, AI, Manager. Explore how DAAM turns scattered onboarding information into checked, approval-ready documents across industries.',
  openGraph: {
    title: 'DAAM — Document operations, reconsidered.',
    description: 'Source-linked facts, surfaced exceptions and document packets prepared for human review. An example workspace.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
