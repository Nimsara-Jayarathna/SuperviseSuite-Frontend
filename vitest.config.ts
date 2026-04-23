import { mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Vitest configuration — extends the base Vite config so the @/ alias,
 * plugins, and resolve settings are inherited automatically.
 * Kept separate to avoid type conflicts between Vite and Vitest's
 * internal Vite version.
 */
export default mergeConfig(viteConfig, {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
