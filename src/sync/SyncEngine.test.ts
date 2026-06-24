/*
 * 功能名称：代码与方块同步引擎单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { describe, expect, it } from 'vitest';
import { astToBlocks } from '../blocks/astToBlocks';
import { blocksToAst } from '../blocks/blocksToAst';
import { DEFAULT_CSHARP_CODE, parseCSharp } from '../core/parser/parseCSharp';
import { astToCSharp } from '../core/serializer/astToCSharp';
import { addStatementBlock, deleteBlock, syncFromBlocks, syncFromCode, updateBlockField } from './SyncEngine';

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

    const commentBlock = withStatement[0].children
      .flatMap((child) => child.children)
      .flatMap((child) => child.children)
      .find((block) => block.type === 'comment' && block.fields.text === '新增说明');

    expect(commentBlock).toBeDefined();
    const withoutStatement = deleteBlock(withStatement, commentBlock?.id ?? '');

    expect(syncFromBlocks(withoutStatement).code).not.toContain('// 新增说明');
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
