/*
 * 功能名称：代码与方块双向同步引擎
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { astToBlocks } from '../blocks/astToBlocks';
import { blocksToAst } from '../blocks/blocksToAst';
import type { StatementBlockType, ToolboxItem, VisualBlock } from '../blocks/blockModel';
import { parseCSharp } from '../core/parser/parseCSharp';
import { astToCSharp } from '../core/serializer/astToCSharp';

export interface CodeSyncResult {
  code: string;
  blocks: VisualBlock[];
  diagnostics: string[];
}

export function syncFromCode(code: string): CodeSyncResult {
  const program = parseCSharp(code);
  return {
    code,
    blocks: astToBlocks(program),
    diagnostics: program.diagnostics.map((diagnostic) => `第 ${diagnostic.line} 行：${diagnostic.message}`),
  };
}

export function syncFromBlocks(blocks: VisualBlock[]): CodeSyncResult {
  const program = blocksToAst(blocks);
  return {
    code: astToCSharp(program),
    blocks,
    diagnostics: [],
  };
}

export function updateBlockField(
  blocks: VisualBlock[],
  blockId: string,
  fieldName: string,
  value: string,
): VisualBlock[] {
  return blocks.map((block) => {
    if (block.id === blockId) {
      return {
        ...block,
        fields: {
          ...block.fields,
          [fieldName]: value,
        },
      };
    }

    return {
      ...block,
      children: updateBlockField(block.children, blockId, fieldName, value),
    };
  });
}

export function addStatementBlock(
  blocks: VisualBlock[],
  parentId: string,
  statementType: StatementBlockType,
): VisualBlock[] {
  return insertStatementBlock(blocks, parentId, Number.POSITIVE_INFINITY, { statementType });
}

export function insertStatementBlock(
  blocks: VisualBlock[],
  parentId: string,
  index: number,
  item: Pick<ToolboxItem, 'statementType' | 'fields'>,
): VisualBlock[] {
  return blocks.map((block) => {
    if (block.id === parentId) {
      const nextChildren = [...block.children];
      const insertIndex = Number.isFinite(index) ? Math.max(0, Math.min(index, nextChildren.length)) : nextChildren.length;
      nextChildren.splice(insertIndex, 0, createStatementBlock(item.statementType, item.fields));

      return {
        ...block,
        children: nextChildren,
      };
    }

    return {
      ...block,
      children: insertStatementBlock(block.children, parentId, index, item),
    };
  });
}

export function moveStatementBlock(
  blocks: VisualBlock[],
  parentId: string,
  fromIndex: number,
  toIndex: number,
): VisualBlock[] {
  return blocks.map((block) => {
    if (block.id === parentId) {
      const nextChildren = [...block.children];
      const [moved] = nextChildren.splice(fromIndex, 1);
      if (!moved) {
        return block;
      }

      nextChildren.splice(Math.max(0, Math.min(toIndex, nextChildren.length)), 0, moved);
      return {
        ...block,
        children: nextChildren,
      };
    }

    return {
      ...block,
      children: moveStatementBlock(block.children, parentId, fromIndex, toIndex),
    };
  });
}

export function deleteBlock(blocks: VisualBlock[], blockId: string): VisualBlock[] {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => ({
      ...block,
      children: deleteBlock(block.children, blockId),
    }));
}

function createStatementBlock(statementType: StatementBlockType, fields: Record<string, string> = {}): VisualBlock {
  const id = `${statementType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (statementType) {
    case 'comment':
      return { id, type: 'comment', label: '注释', fields: { text: '新增说明', ...fields }, children: [] };
    case 'variable':
      return {
        id,
        type: 'variable',
        label: '变量',
        fields: { type: 'var', name: 'value', initializer: '0', ...fields },
        children: [],
      };
    case 'assignment':
      return { id, type: 'assignment', label: '赋值', fields: { target: 'value', expression: '1', ...fields }, children: [] };
    case 'call':
      return {
        id,
        type: 'call',
        label: '调用',
        fields: { callee: 'Console.WriteLine', arguments: 'value', ...fields },
        children: [],
      };
    case 'if':
      return { id, type: 'if', label: '如果', fields: { condition: 'value > 0', ...fields }, children: [] };
    case 'return':
      return { id, type: 'return', label: '返回', fields: { expression: 'value', ...fields }, children: [] };
    case 'unknown':
      return { id, type: 'unknown', label: 'Roslyn 原始语法', fields: { text: '// 在这里输入任意 C# 语法', ...fields }, children: [] };
  }
}
