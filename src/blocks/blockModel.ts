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

export type StatementBlockType = Extract<BlockType, 'comment' | 'variable' | 'assignment' | 'call' | 'if' | 'return'>;
