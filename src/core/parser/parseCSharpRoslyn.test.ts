/*
 * 功能名称：Roslyn C# 语法解析 API 客户端单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCSharpWithRoslyn } from './parseCSharpRoslyn';

describe('parseCSharpWithRoslyn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('通过 /api/parse 获取 Roslyn 语法树', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        languageVersion: 'preview',
        hasErrors: false,
        diagnostics: [],
        root: { kind: 'CompilationUnit', isToken: false, text: '', spanStart: 0, spanEnd: 0, children: [] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await parseCSharpWithRoslyn('class Demo {}');

    expect(fetchMock).toHaveBeenCalledWith('/api/parse', expect.objectContaining({ method: 'POST' }));
    expect(result?.root.kind).toBe('CompilationUnit');
  });

  it('服务不可用时返回 null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(parseCSharpWithRoslyn('')).resolves.toBeNull();
  });
});
