import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      all: true,
      include: [
        'src/app/core/services/api-config.service.ts',
        'src/app/core/services/token.service.ts',
        'src/app/core/services/store-context.service.ts',
        'src/app/core/services/session.service.ts',
        'src/app/core/guards/auth.guard.ts',
        'src/app/core/guards/role.guard.ts',
        'src/app/core/interceptors/auth.interceptor.ts',
        'src/app/core/interceptors/store.interceptor.ts',
        'src/app/core/interceptors/error.interceptor.ts'
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
