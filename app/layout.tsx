import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Decay Monitor',
  description: 'Early Warning System - Detects corporate bankruptcies 30-90 days before',
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
