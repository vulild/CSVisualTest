/*
 * 功能名称：Roslyn C# 语法解析 API 客户端
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { RoslynParseResponse } from './RoslynSyntax';

export async function parseCSharpWithRoslyn(
  source: string,
  signal?: AbortSignal,
): Promise<RoslynParseResponse | null> {
  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source }),
    signal,
  };

  return (await requestRoslyn('/api/parse', request)) ?? (await requestRoslyn('http://localhost:5087/api/parse', request));
}

async function requestRoslyn(url: string, request: RequestInit): Promise<RoslynParseResponse | null> {
  try {
    const response = await fetch(url, request);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as RoslynParseResponse;
  } catch {
    return null;
  }
}
