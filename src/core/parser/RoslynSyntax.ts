/*
 * 功能名称：Roslyn C# 语法树前端数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */

export interface RoslynParseResponse {
  languageVersion: string;
  hasErrors: boolean;
  diagnostics: RoslynDiagnostic[];
  root: RoslynSyntaxNode;
}

export interface RoslynDiagnostic {
  id: string;
  severity: string;
  message: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

export interface RoslynSyntaxNode {
  kind: string;
  isToken: boolean;
  text: string;
  spanStart: number;
  spanEnd: number;
  children: RoslynSyntaxNode[];
}
