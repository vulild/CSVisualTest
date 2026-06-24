/*
 * 功能名称：前端构建与测试配置
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
