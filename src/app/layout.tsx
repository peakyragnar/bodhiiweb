import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bodhii - AI Home Repair Assistant',
  description: 'Your AI-powered home repair assistant',
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
