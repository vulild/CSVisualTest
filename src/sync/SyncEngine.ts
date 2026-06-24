/*
 * 功能名称：代码与方块双向同步引擎
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { astToBlocks } from '../blocks/astToBlocks';
import { blocksToAst } from '../blocks/blocksToAst';
import type { StatementBlockType, VisualBlock } from '../blocks/blockModel';
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
  return blocks.map((block) => {
    if (block.id === parentId) {
      return {
        ...block,
        children: [...block.children, createStatementBlock(statementType)],
      };
    }

    return {
      ...block,
      children: addStatementBlock(block.children, parentId, statementType),
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

function createStatementBlock(statementType: StatementBlockType): VisualBlock {
  const id = `${statementType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  switch (statementType) {
    case 'comment':
      return { id, type: 'comment', label: '注释', fields: { text: '新增说明' }, children: [] };
    case 'variable':
      return { id, type: 'variable', label: '变量', fields: { type: 'var', name: 'value', initializer: '0' }, children: [] };
    case 'assignment':
      return { id, type: 'assignment', label: '赋值', fields: { target: 'value', expression: '1' }, children: [] };
    case 'call':
      return { id, type: 'call', label: '调用', fields: { callee: 'Console.WriteLine', arguments: 'value' }, children: [] };
    case 'if':
      return { id, type: 'if', label: '如果', fields: { condition: 'value > 0' }, children: [] };
    case 'return':
      return { id, type: 'return', label: '返回', fields: { expression: 'value' }, children: [] };
  }
}
