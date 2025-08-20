import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Xianna Admin - Panel de Administración',
    template: '%s | Xianna Admin'
  },
  description: 'Panel de administración para gestionar contenido, usuarios y analíticas de Xianna.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
            <Toaster richColors position="top-center" />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
