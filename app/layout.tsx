import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sistema de Disparo',
  description: 'Sistema de gestión y control de disparos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
