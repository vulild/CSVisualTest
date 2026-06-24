/*
 * 功能名称：C# LSP 风格 API 前端客户端单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCSharpCompletions, getCSharpDiagnostics, getCSharpHover } from './csharpLspClient';

describe('csharpLspClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('请求 Roslyn 诊断 markers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: 'CS1002',
          message: '; expected',
          severity: 'Error',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const markers = await getCSharpDiagnostics('class Demo');

    expect(fetchMock).toHaveBeenCalledWith('/api/lsp/diagnostics', expect.objectContaining({ method: 'POST' }));
    expect(markers[0].id).toBe('CS1002');
  });

  it('请求 Roslyn 补全项', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [{ label: 'WriteLine', kind: 'Method', detail: '', insertText: 'WriteLine', sortText: '0' }] }),
      }),
    );

    const completions = await getCSharpCompletions('Console.', 8);

    expect(completions.items[0].label).toBe('WriteLine');
  });

  it('请求 Roslyn 悬停信息，204 时返回 null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      }),
    );

    await expect(getCSharpHover('class Demo {}', 0)).resolves.toBeNull();
  });
});
