import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Baseline Vite configuration for the desktop web client.
 */
const webViteConfig = defineConfig({
  plugins: [react()]
});

export default webViteConfig;
