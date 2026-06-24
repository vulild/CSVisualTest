/*
 * 功能名称：C# AST 代码序列化器
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type {
  CSharpClassDeclaration,
  CSharpMethodDeclaration,
  CSharpParameter,
  CSharpProgram,
  CSharpStatement,
} from '../ast/CSharpAst';

export function astToCSharp(program: CSharpProgram): string {
  const lines: string[] = [];

  program.usings.forEach((usingName) => {
    lines.push(`using ${usingName};`);
  });

  if (program.usings.length > 0) {
    lines.push('');
  }

  if (program.namespaceName) {
    lines.push(`namespace ${program.namespaceName}`);
    lines.push('{');
    program.classes.forEach((classDeclaration, index) => {
      lines.push(...serializeClass(classDeclaration, 1));
      if (index < program.classes.length - 1) {
        lines.push('');
      }
    });
    lines.push('}');
  } else {
    program.classes.forEach((classDeclaration, index) => {
      lines.push(...serializeClass(classDeclaration, 0));
      if (index < program.classes.length - 1) {
        lines.push('');
      }
    });
  }

  return `${lines.join('\n')}\n`;
}

function serializeClass(classDeclaration: CSharpClassDeclaration, indentLevel: number): string[] {
  const indent = toIndent(indentLevel);
  const lines = [`${indent}public class ${classDeclaration.name}`, `${indent}{`];

  classDeclaration.methods.forEach((method, index) => {
    lines.push(...serializeMethod(method, indentLevel + 1));
    if (index < classDeclaration.methods.length - 1) {
      lines.push('');
    }
  });

  lines.push(`${indent}}`);
  return lines;
}

function serializeMethod(method: CSharpMethodDeclaration, indentLevel: number): string[] {
  const indent = toIndent(indentLevel);
  const modifiers = method.modifiers.length > 0 ? method.modifiers.join(' ') : 'public';
  const parameters = method.parameters.map(serializeParameter).join(', ');
  const lines = [`${indent}${modifiers} ${method.returnType} ${method.name}(${parameters})`, `${indent}{`];

  lines.push(...serializeStatements(method.statements, indentLevel + 1));
  lines.push(`${indent}}`);
  return lines;
}

function serializeParameter(parameter: CSharpParameter): string {
  return `${parameter.type} ${parameter.name}`.trim();
}

function serializeStatements(statements: CSharpStatement[], indentLevel: number): string[] {
  return statements.flatMap((statement) => serializeStatement(statement, indentLevel));
}

function serializeStatement(statement: CSharpStatement, indentLevel: number): string[] {
  const indent = toIndent(indentLevel);

  switch (statement.kind) {
    case 'comment':
      return [`${indent}// ${statement.text}`];
    case 'variable':
      return [
        statement.initializer
          ? `${indent}${statement.type} ${statement.name} = ${statement.initializer};`
          : `${indent}${statement.type} ${statement.name};`,
      ];
    case 'assignment':
      return [`${indent}${statement.target} = ${statement.expression};`];
    case 'call':
      return [`${indent}${statement.callee}(${statement.arguments.join(', ')});`];
    case 'if': {
      const lines = [`${indent}if (${statement.condition})`, `${indent}{`];
      lines.push(...serializeStatements(statement.thenStatements, indentLevel + 1));
      lines.push(`${indent}}`);
      if (statement.elseStatements.length > 0) {
        lines.push(`${indent}else`);
        lines.push(`${indent}{`);
        lines.push(...serializeStatements(statement.elseStatements, indentLevel + 1));
        lines.push(`${indent}}`);
      }
      return lines;
    }
    case 'return':
      return [statement.expression ? `${indent}return ${statement.expression};` : `${indent}return;`];
    case 'unknown':
      return [`${indent}${statement.text};`];
  }
}

function toIndent(level: number): string {
  return '    '.repeat(level);
}
