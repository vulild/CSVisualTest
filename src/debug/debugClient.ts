/*
 * 功能名称：IDE 运行调试 API 前端客户端
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { CSharpRunResponse, DebugSession } from './debugTypes';

export function runCSharpCode(source: string, signal?: AbortSignal): Promise<CSharpRunResponse> {
  return postIde<CSharpRunResponse>(
    '/api/run',
    { source },
    signal,
    { success: false, exitCode: -1, output: [{ stream: 'stderr', text: '运行服务不可用。' }], diagnostics: [] },
  );
}

export function startDebugSession(
  source: string,
  breakpoints: number[],
  signal?: AbortSignal,
): Promise<DebugSession> {
  return postIde<DebugSession>('/api/debug/start', { source, breakpoints }, signal, unavailableSession());
}

export function stepDebugSession(sessionId: string, signal?: AbortSignal): Promise<DebugSession> {
  return postIde<DebugSession>('/api/debug/step', { sessionId }, signal, unavailableSession(sessionId));
}

export function continueDebugSession(sessionId: string, signal?: AbortSignal): Promise<DebugSession> {
  return postIde<DebugSession>('/api/debug/continue', { sessionId }, signal, unavailableSession(sessionId));
}

export function stopDebugSession(sessionId: string, signal?: AbortSignal): Promise<DebugSession> {
  return postIde<DebugSession>('/api/debug/stop', { sessionId }, signal, unavailableSession(sessionId, 'Stopped'));
}

async function postIde<T>(path: string, body: unknown, signal: AbortSignal | undefined, fallback: T): Promise<T> {
  const request: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  };

  return (await requestJson<T>(path, request)) ?? (await requestJson<T>(`http://localhost:5087${path}`, request)) ?? fallback;
}

async function requestJson<T>(url: string, request: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, request);
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function unavailableSession(sessionId = '', state: DebugSession['state'] = 'Stopped'): DebugSession {
  return {
    sessionId,
    state,
    currentLine: null,
    hitBreakpoint: false,
    variables: [],
    output: [{ stream: 'stderr', text: '调试服务不可用。' }],
  };
}
