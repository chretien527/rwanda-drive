import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rwanda Drive - Digital Driving Credentials Platform',
  description:
    'Secure, mobile-first digital portal for Rwandan driving licences, Carte Jaune logbooks, motor insurance, and roadworthiness inspection certificates.',
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
