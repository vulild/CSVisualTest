/*
 * 功能名称：C# LSP 风格 API 前端客户端
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */

export interface CSharpDiagnosticMarker {
  id: string;
  message: string;
  severity: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface CSharpCompletionResponse {
  items: CSharpCompletionItem[];
}

export interface CSharpCompletionItem {
  label: string;
  kind: string;
  detail: string;
  insertText: string;
  sortText: string;
}

export interface CSharpHoverResponse {
  contents: string;
  start: number;
  end: number;
}

export function getCSharpDiagnostics(source: string, signal?: AbortSignal): Promise<CSharpDiagnosticMarker[]> {
  return postRoslyn<CSharpDiagnosticMarker[]>('/api/lsp/diagnostics', { source }, signal, []);
}

export function getCSharpCompletions(
  source: string,
  position: number,
  signal?: AbortSignal,
): Promise<CSharpCompletionResponse> {
  return postRoslyn<CSharpCompletionResponse>('/api/lsp/completions', { source, position }, signal, { items: [] });
}

export function getCSharpHover(
  source: string,
  position: number,
  signal?: AbortSignal,
): Promise<CSharpHoverResponse | null> {
  return postRoslyn<CSharpHoverResponse | null>('/api/lsp/hover', { source, position }, signal, null);
}

async function postRoslyn<T>(path: string, body: unknown, signal: AbortSignal | undefined, fallback: T): Promise<T> {
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
    if (!response.ok || response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
