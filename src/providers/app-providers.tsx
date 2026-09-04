'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { whoAmIAction } from '@/server/actions/auth';
import type { SessionUser } from '@/types';

// ---------------- session context ----------------
interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null, isLoading: true, refresh: async () => {},
});

export const useSession = () => useContext(SessionContext);

function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: whoAmIAction,
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<SessionContextValue>(() => ({
    user: data ?? null,
    isLoading,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  }), [data, isLoading, queryClient]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ---------------- root providers ----------------
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <SessionProvider>{children}</SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
