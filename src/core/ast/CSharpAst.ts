/*
 * 功能名称：C# 可视化 IDE 统一语法树模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */

export type CSharpStatement =
  | CSharpCommentStatement
  | CSharpVariableDeclaration
  | CSharpAssignmentStatement
  | CSharpMethodCallStatement
  | CSharpIfStatement
  | CSharpReturnStatement
  | CSharpUnknownStatement;

export interface CSharpProgram {
  usings: string[];
  namespaceName?: string;
  classes: CSharpClassDeclaration[];
  diagnostics: CSharpDiagnostic[];
}

export interface CSharpDiagnostic {
  message: string;
  line: number;
}

export interface CSharpClassDeclaration {
  id: string;
  name: string;
  methods: CSharpMethodDeclaration[];
}

export interface CSharpMethodDeclaration {
  id: string;
  name: string;
  returnType: string;
  modifiers: string[];
  parameters: CSharpParameter[];
  statements: CSharpStatement[];
}

export interface CSharpParameter {
  type: string;
  name: string;
}

export interface CSharpCommentStatement {
  id: string;
  kind: 'comment';
  text: string;
}

export interface CSharpVariableDeclaration {
  id: string;
  kind: 'variable';
  type: string;
  name: string;
  initializer: string;
}

export interface CSharpAssignmentStatement {
  id: string;
  kind: 'assignment';
  target: string;
  expression: string;
}

export interface CSharpMethodCallStatement {
  id: string;
  kind: 'call';
  callee: string;
  arguments: string[];
}

export interface CSharpIfStatement {
  id: string;
  kind: 'if';
  condition: string;
  thenStatements: CSharpStatement[];
  elseStatements: CSharpStatement[];
}

export interface CSharpReturnStatement {
  id: string;
  kind: 'return';
  expression: string;
}

export interface CSharpUnknownStatement {
  id: string;
  kind: 'unknown';
  text: string;
}
