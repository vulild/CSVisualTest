/*
 * 功能名称：前端构建与测试配置
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5087',
      '/health': 'http://localhost:5087',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
