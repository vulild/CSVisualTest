/*
 * 功能名称：单元测试环境配置
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (value: string) => void;
    options?: { ariaLabel?: string };
  }) =>
    React.createElement('textarea', {
      'aria-label': options?.ariaLabel ?? 'C# 代码编辑器',
      className: 'monaco-editor-mock',
      value,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    }),
}));
