import { defineConfig } from 'vitest/config';
import path from 'node:path';

// ------------------------------------------------------------
// Dev Prep — unit test configuration
// jsdom for client-side units (router, stores, components);
// per-file `@vitest-environment node` for server-side units.
// `server-only`, `next/headers` and the Prisma client are
// stubbed so pure server logic (crypto, schemas) can be
// tested hermetically without a database or request context.
// ------------------------------------------------------------
export default defineConfig({
  esbuild: { jsx: 'automatic' } as unknown as Record<string, never>,
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/lib/**', 'src/router/**', 'src/server/**', 'src/types/**', 'src/db/seed/generator.ts'],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './tests/stubs/empty.ts'),
      'next/headers': path.resolve(__dirname, './tests/stubs/next-headers.ts'),
      '@/lib/db': path.resolve(__dirname, './tests/stubs/db.ts'),
    },
  },
});
