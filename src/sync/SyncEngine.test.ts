/*
 * 功能名称：代码与方块同步引擎单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { describe, expect, it } from 'vitest';
import { astToBlocks } from '../blocks/astToBlocks';
import { blocksToAst } from '../blocks/blocksToAst';
import type { VisualBlock } from '../blocks/blockModel';
import { DEFAULT_CSHARP_CODE, parseCSharp } from '../core/parser/parseCSharp';
import { astToCSharp } from '../core/serializer/astToCSharp';
import {
  addStatementBlock,
  deleteBlock,
  insertStatementBlock,
  moveStatementBlock,
  syncFromBlocks,
  syncFromCode,
  updateBlockField,
} from './SyncEngine';

describe('SyncEngine', () => {
  it('支持代码到方块再回到代码的往返同步', () => {
    const fromCode = syncFromCode(DEFAULT_CSHARP_CODE);
    const fromBlocks = syncFromBlocks(fromCode.blocks);

    expect(fromBlocks.code).toContain('public class Greeter');
    expect(fromBlocks.code).toContain('Console.WriteLine(message);');
    expect(fromBlocks.code).toContain('return message;');
  });

  it('更新方块字段后生成新的 C# 代码', () => {
    const fromCode = syncFromCode(DEFAULT_CSHARP_CODE);
    const renamedBlocks = updateBlockField(fromCode.blocks, 'class-greeter-0', 'name', 'VisualGreeter');
    const fromBlocks = syncFromBlocks(renamedBlocks);

    expect(fromBlocks.code).toContain('public class VisualGreeter');
  });

  it('支持添加和删除语句方块', () => {
    const fromCode = syncFromCode(DEFAULT_CSHARP_CODE);
    const methodId = 'method-sayhello-0';
    const withStatement = addStatementBlock(fromCode.blocks, methodId, 'comment');
    const addedCode = syncFromBlocks(withStatement).code;

    expect(addedCode).toContain('// 新增说明');

    const commentBlock = findBlock(withStatement, (block) => block.type === 'comment' && block.fields.text === '新增说明');

    expect(commentBlock).toBeDefined();
    const withoutStatement = deleteBlock(withStatement, commentBlock?.id ?? '');

    expect(syncFromBlocks(withoutStatement).code).not.toContain('// 新增说明');
  });

  it('支持从工具箱按指定位置插入 Roslyn 原始语法模板', () => {
    const fromCode = syncFromCode(DEFAULT_CSHARP_CODE);
    const withLoop = insertStatementBlock(fromCode.blocks, 'method-sayhello-0', 1, {
      statementType: 'unknown',
      fields: { text: 'for (int i = 0; i < 3; i++)\n{\n    Console.WriteLine(i);\n}' },
    });
    const generatedCode = syncFromBlocks(withLoop).code;

    expect(generatedCode).toContain('for (int i = 0; i < 3; i++)');
    expect(generatedCode.indexOf('for (int i = 0; i < 3; i++)')).toBeLessThan(
      generatedCode.indexOf('Console.WriteLine(message);'),
    );
  });

  it('支持拖动语句调整同一容器内的顺序', () => {
    const fromCode = syncFromCode(DEFAULT_CSHARP_CODE);
    const reorderedBlocks = moveStatementBlock(fromCode.blocks, 'method-sayhello-0', 3, 0);
    const generatedCode = syncFromBlocks(reorderedBlocks).code;

    expect(generatedCode.indexOf('return message;')).toBeLessThan(generatedCode.indexOf('string message'));
  });

  it('方块转换保留统一 AST 的核心结构', () => {
    const program = parseCSharp(DEFAULT_CSHARP_CODE);
    const blocks = astToBlocks(program);
    const nextProgram = blocksToAst(blocks);
    const nextCode = astToCSharp(nextProgram);

    expect(nextProgram.classes[0].methods[0].statements).toHaveLength(4);
    expect(nextCode).toContain('namespace DemoApp');
  });
});

function findBlock(blocks: VisualBlock[], predicate: (block: VisualBlock) => boolean): VisualBlock | undefined {
  for (const block of blocks) {
    if (predicate(block)) {
      return block;
    }

    const childMatch = findBlock(block.children, predicate);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
}
