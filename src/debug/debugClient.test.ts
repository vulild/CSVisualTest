/*
 * 功能名称：IDE 运行调试 API 客户端单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { continueDebugSession, runCSharpCode, startDebugSession, stepDebugSession, stopDebugSession } from './debugClient';

describe('debugClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('调用 /api/run 启动 C# 代码', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, exitCode: 0, output: [{ stream: 'stdout', text: 'ok' }], diagnostics: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCSharpCode('Console.WriteLine("ok");');

    expect(fetchMock).toHaveBeenCalledWith('/api/run', expect.objectContaining({ method: 'POST' }));
    expect(result.output[0].text).toBe('ok');
  });

  it('调用调试会话端点', async () => {
    const session = {
      sessionId: 'debug-1',
      state: 'Paused',
      currentLine: 3,
      hitBreakpoint: false,
      variables: [],
      output: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => session,
    });
    vi.stubGlobal('fetch', fetchMock);

    await startDebugSession('var value = 1;', [3]);
    await stepDebugSession('debug-1');
    await continueDebugSession('debug-1');
    await stopDebugSession('debug-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/debug/start', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/debug/step', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/debug/continue', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/debug/stop', expect.any(Object));
  });
});
