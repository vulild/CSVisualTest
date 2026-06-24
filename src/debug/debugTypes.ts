/*
 * 功能名称：IDE 运行调试前端数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */

export type DebugState = 'Idle' | 'Running' | 'Paused' | 'Completed' | 'Stopped';

export interface IdeOutputLine {
  stream: 'stdout' | 'stderr' | string;
  text: string;
}

export interface VariableInfo {
  name: string;
  type: string;
  value: string;
}

export interface CSharpRunResponse {
  success: boolean;
  exitCode: number;
  output: IdeOutputLine[];
  diagnostics: Array<{
    id: string;
    message: string;
    severity: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }>;
}

export interface DebugSession {
  sessionId: string;
  state: DebugState;
  currentLine: number | null;
  hitBreakpoint: boolean;
  variables: VariableInfo[];
  output: IdeOutputLine[];
}
