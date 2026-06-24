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
        children: [],
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
