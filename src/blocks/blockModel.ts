/*
 * 功能名称：Scratch 风格方块数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */

export type BlockType =
  | 'program'
  | 'using'
  | 'namespace'
  | 'class'
  | 'method'
  | 'comment'
  | 'variable'
  | 'assignment'
  | 'call'
  | 'if'
  | 'return'
  | 'unknown';

export interface VisualBlock {
  id: string;
  type: BlockType;
  label: string;
  fields: Record<string, string>;
  children: VisualBlock[];
}

export type StatementBlockType = Extract<BlockType, 'comment' | 'variable' | 'assignment' | 'call' | 'if' | 'return' | 'unknown'>;

export interface ToolboxItem {
  id: string;
  label: string;
  description: string;
  statementType: StatementBlockType;
  fields?: Record<string, string>;
}

export const COMMON_SYNTAX_TOOLS: ToolboxItem[] = [
  { id: 'variable', label: '变量', description: '声明局部变量', statementType: 'variable' },
  { id: 'assignment', label: '赋值', description: '修改已有变量', statementType: 'assignment' },
  { id: 'call', label: '调用', description: '调用方法', statementType: 'call' },
  { id: 'if', label: '如果', description: '条件分支', statementType: 'if' },
  { id: 'return', label: '返回', description: '返回结果', statementType: 'return' },
  { id: 'comment', label: '注释', description: '添加说明', statementType: 'comment' },
  {
    id: 'for',
    label: 'for 循环',
    description: 'Roslyn 原始语法模板',
    statementType: 'unknown',
    fields: { text: 'for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine(i);\n}' },
  },
  {
    id: 'while',
    label: 'while 循环',
    description: 'Roslyn 原始语法模板',
    statementType: 'unknown',
    fields: { text: 'while (condition)\n{\n    break;\n}' },
  },
  {
    id: 'foreach',
    label: 'foreach 循环',
    description: 'Roslyn 原始语法模板',
    statementType: 'unknown',
    fields: { text: 'foreach (var item in items)\n{\n    Console.WriteLine(item);\n}' },
  },
  {
    id: 'switch',
    label: 'switch',
    description: 'Roslyn 原始语法模板',
    statementType: 'unknown',
    fields: { text: 'switch (value)\n{\n    case 1:\n        break;\n    default:\n        break;\n}' },
  },
  {
    id: 'try',
    label: 'try/catch',
    description: 'Roslyn 原始语法模板',
    statementType: 'unknown',
    fields: { text: 'try\n{\n    Run();\n}\ncatch (Exception ex)\n{\n    Console.WriteLine(ex.Message);\n}' },
  },
];
