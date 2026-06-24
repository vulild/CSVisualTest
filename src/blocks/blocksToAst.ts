/*
 * 功能名称：Scratch 风格方块转 C# AST
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type {
  CSharpClassDeclaration,
  CSharpMethodDeclaration,
  CSharpParameter,
  CSharpProgram,
  CSharpStatement,
} from '../core/ast/CSharpAst';
import { splitTopLevelComma } from '../core/parser/splitTopLevel';
import type { VisualBlock } from './blockModel';

export function blocksToAst(blocks: VisualBlock[]): CSharpProgram {
  const root = blocks.find((block) => block.type === 'program') ?? blocks[0];
  const rootChildren = root?.children ?? [];
  const namespaceBlock = rootChildren.find((block) => block.type === 'namespace');
  const classBlocks = namespaceBlock
    ? namespaceBlock.children.filter((block) => block.type === 'class')
    : rootChildren.filter((block) => block.type === 'class');

  return {
    usings: rootChildren
      .filter((block) => block.type === 'using')
      .map((block) => block.fields.name.trim())
      .filter(Boolean),
    namespaceName: namespaceBlock?.fields.name.trim() || undefined,
    classes: classBlocks.map(blockToClass),
    diagnostics: [],
  };
}

function blockToClass(block: VisualBlock): CSharpClassDeclaration {
  return {
    id: block.id,
    name: block.fields.name.trim() || 'Program',
    methods: block.children.filter((child) => child.type === 'method').map(blockToMethod),
  };
}

function blockToMethod(block: VisualBlock): CSharpMethodDeclaration {
  return {
    id: block.id,
    name: block.fields.name.trim() || 'Run',
    returnType: block.fields.returnType.trim() || 'void',
    modifiers: (block.fields.modifiers || 'public').split(/\s+/).filter(Boolean),
    parameters: parseParameterText(block.fields.parameters),
    statements: block.children.filter(isStatementBlock).map(blockToStatement),
  };
}

function blockToStatement(block: VisualBlock): CSharpStatement {
  switch (block.type) {
    case 'comment':
      return {
        id: block.id,
        kind: 'comment',
        text: block.fields.text ?? '',
      };
    case 'variable':
      return {
        id: block.id,
        kind: 'variable',
        type: block.fields.type?.trim() || 'var',
        name: block.fields.name?.trim() || 'value',
        initializer: block.fields.initializer?.trim() ?? '',
      };
    case 'assignment':
      return {
        id: block.id,
        kind: 'assignment',
        target: block.fields.target?.trim() || 'value',
        expression: block.fields.expression?.trim() || 'null',
      };
    case 'call':
      return {
        id: block.id,
        kind: 'call',
        callee: block.fields.callee?.trim() || 'Console.WriteLine',
        arguments: splitCsv(block.fields.arguments),
      };
    case 'if':
      return {
        id: block.id,
        kind: 'if',
        condition: block.fields.condition?.trim() || 'true',
        thenStatements: block.children.filter(isStatementBlock).map(blockToStatement),
        elseStatements: [],
      };
    case 'return':
      return {
        id: block.id,
        kind: 'return',
        expression: block.fields.expression?.trim() ?? '',
      };
    case 'unknown':
    default:
      return {
        id: block.id,
        kind: 'unknown',
        text: block.fields.text?.trim() || '// unsupported',
      };
  }
}

function parseParameterText(source = ''): CSharpParameter[] {
  return splitCsv(source).map((parameter) => {
    const parts = parameter.trim().split(/\s+/);
    const name = parts.pop() || 'value';
    return {
      type: parts.join(' ') || 'object',
      name,
    };
  });
}

function splitCsv(source = ''): string[] {
  return splitTopLevelComma(source);
}

function isStatementBlock(block: VisualBlock): boolean {
  return ['comment', 'variable', 'assignment', 'call', 'if', 'return', 'unknown'].includes(block.type);
}
