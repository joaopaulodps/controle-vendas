import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Controle de Vendas',
  description: 'Sistema de controle de compras e vendas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen dark:bg-gray-900">
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
