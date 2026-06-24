/*
 * 功能名称：C# AST 转 Scratch 风格方块
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type {
  CSharpClassDeclaration,
  CSharpMethodDeclaration,
  CSharpProgram,
  CSharpStatement,
} from '../core/ast/CSharpAst';
import type { VisualBlock } from './blockModel';

export function astToBlocks(program: CSharpProgram): VisualBlock[] {
  const rootChildren = [
    ...program.usings.map((usingName, index) => ({
      id: `using-${index}`,
      type: 'using' as const,
      label: '引用命名空间',
      fields: { name: usingName },
      children: [],
    })),
    ...(program.namespaceName
      ? [
          {
            id: 'namespace-root',
            type: 'namespace' as const,
            label: '命名空间',
            fields: { name: program.namespaceName },
            children: program.classes.map(classToBlock),
          },
        ]
      : program.classes.map(classToBlock)),
  ];

  return [
    {
      id: 'program-root',
      type: 'program',
      label: 'C# 程序',
      fields: {},
      children: rootChildren,
    },
  ];
}

function classToBlock(classDeclaration: CSharpClassDeclaration): VisualBlock {
  return {
    id: classDeclaration.id,
    type: 'class',
    label: '类',
    fields: { name: classDeclaration.name },
    children: classDeclaration.methods.map(methodToBlock),
  };
}

function methodToBlock(method: CSharpMethodDeclaration): VisualBlock {
  return {
    id: method.id,
    type: 'method',
    label: '方法',
    fields: {
      modifiers: method.modifiers.join(' '),
      returnType: method.returnType,
      name: method.name,
      parameters: method.parameters.map((parameter) => `${parameter.type} ${parameter.name}`).join(', '),
    },
    children: method.statements.map(statementToBlock),
  };
}

function statementToBlock(statement: CSharpStatement): VisualBlock {
  switch (statement.kind) {
    case 'comment':
      return {
        id: statement.id,
        type: 'comment',
        label: '注释',
        fields: { text: statement.text },
        children: [],
      };
    case 'variable':
      return {
        id: statement.id,
        type: 'variable',
        label: '变量',
        fields: { type: statement.type, name: statement.name, initializer: statement.initializer },
        children: [],
      };
    case 'assignment':
      return {
        id: statement.id,
        type: 'assignment',
        label: '赋值',
        fields: { target: statement.target, expression: statement.expression },
        children: [],
      };
    case 'call':
      return {
        id: statement.id,
        type: 'call',
        label: '调用',
        fields: { callee: statement.callee, arguments: statement.arguments.join(', ') },
        children: statement.arguments.flatMap((argument, index) => expressionToNestedCallBlocks(argument, `${statement.id}-arg-${index}`)),
      };
    case 'if':
      return {
        id: statement.id,
        type: 'if',
        label: '如果',
        fields: { condition: statement.condition },
        children: statement.thenStatements.map(statementToBlock),
      };
    case 'return':
      return {
        id: statement.id,
        type: 'return',
        label: '返回',
        fields: { expression: statement.expression },
        children: [],
      };
    case 'unknown':
      return {
        id: statement.id,
        type: 'unknown',
        label: '原始语句',
        fields: { text: statement.text },
        children: [],
      };
  }
}

function expressionToNestedCallBlocks(expression: string, idPrefix: string): VisualBlock[] {
  const parsed = parseCallExpression(expression);
  if (!parsed) {
    return [];
  }

  return [
    {
      id: `${idPrefix}-${sanitizeIdPart(parsed.callee)}`,
      type: 'call',
      label: '嵌套调用',
      fields: { callee: parsed.callee, arguments: parsed.arguments.join(', ') },
      children: parsed.arguments.flatMap((argument, index) =>
        expressionToNestedCallBlocks(argument, `${idPrefix}-${sanitizeIdPart(parsed.callee)}-${index}`),
      ),
    },
  ];
}

function parseCallExpression(expression: string): { callee: string; arguments: string[] } | null {
  const trimmed = expression.trim();
  const openParenIndex = findFirstCallOpenParen(trimmed);
  if (openParenIndex === -1) {
    return null;
  }

  const closeParenIndex = findMatchingParen(trimmed, openParenIndex);
  if (closeParenIndex === -1) {
    return null;
  }

  const callee = readCallee(trimmed, openParenIndex);
  if (!callee) {
    return null;
  }

  return {
    callee,
    arguments: splitCallArguments(trimmed.slice(openParenIndex + 1, closeParenIndex)),
  };
}

function findFirstCallOpenParen(expression: string): number {
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    const previous = expression[index - 1];

    if (quote) {
      if (char === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '(' && /[\w)]/.test(expression[index - 1] ?? '')) {
      return index;
    }
  }

  return -1;
}

function findMatchingParen(expression: string, openParenIndex: number): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = openParenIndex; index < expression.length; index += 1) {
    const char = expression[index];
    const previous = expression[index - 1];

    if (quote) {
      if (char === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '(') {
      depth += 1;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function readCallee(expression: string, openParenIndex: number): string {
  const beforeParen = expression.slice(0, openParenIndex).trimEnd();
  const match = beforeParen.match(/([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)$/);
  return match?.[1] ?? '';
}

function splitCallArguments(source: string): string[] {
  const argumentsList: string[] = [];
  let depth = 0;
  let quote: '"' | "'" | null = null;
  let start = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const previous = source[index - 1];

    if (quote) {
      if (char === quote && previous !== '\\') {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (char === ',' && depth === 0) {
      argumentsList.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }

  argumentsList.push(source.slice(start).trim());
  return argumentsList.filter(Boolean);
}

function sanitizeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'call';
}
