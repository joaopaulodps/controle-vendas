'use client'

import { ReactNode, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-muted">Carregando...</div></div>}>
          {children}
        </Suspense>
      </QueryClientProvider>
    </SessionProvider>
  )
}