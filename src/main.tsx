/*
 * 功能名称：C# 方块式 IDE 浏览器入口
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
