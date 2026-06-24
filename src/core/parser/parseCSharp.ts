/*
 * 功能名称：C# 子集语法解析器
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type {
  CSharpClassDeclaration,
  CSharpDiagnostic,
  CSharpMethodDeclaration,
  CSharpParameter,
  CSharpProgram,
  CSharpStatement,
} from '../ast/CSharpAst';
import { splitTopLevelComma } from './splitTopLevel';

const METHOD_MODIFIERS = new Set([
  'public',
  'private',
  'protected',
  'internal',
  'static',
  'async',
  'virtual',
  'override',
  'sealed',
]);

export const DEFAULT_CSHARP_CODE = `using System;

namespace DemoApp
{
    public class Greeter
    {
        public string SayHello(string name)
        {
            string message = "Hello, " + name;
            Console.WriteLine(message);
            if (name == "Scratch")
            {
                return "Visual C#";
            }

            return message;
        }

        public static void Main()
        {
            Console.WriteLine(new Greeter().SayHello("Scratch"));
        }
    }
}
`;

export function parseCSharp(source: string): CSharpProgram {
  const diagnostics: CSharpDiagnostic[] = [];
  const usings = Array.from(source.matchAll(/^\s*using\s+([A-Za-z0-9_.]+)\s*;/gm)).map((match) => match[1]);
  const namespaceName = parseNamespaceName(source);
  const classes = parseClasses(source, diagnostics);

  if (classes.length === 0) {
    diagnostics.push({
      message: '未找到 class 声明，方块区将显示空程序。',
      line: 1,
    });
  }

  return {
    usings,
    namespaceName,
    classes,
    diagnostics,
  };
}

function parseNamespaceName(source: string): string | undefined {
  const match = source.match(/\bnamespace\s+([A-Za-z_][\w.]*)\s*[;{]/);
  return match?.[1];
}

function parseClasses(source: string, diagnostics: CSharpDiagnostic[]): CSharpClassDeclaration[] {
  const classes: CSharpClassDeclaration[] = [];
  const classRegex = /\bclass\s+([A-Za-z_]\w*)[^{]*\{/g;
  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(source)) !== null) {
    const className = match[1];
    const openBraceIndex = source.indexOf('{', match.index);
    const closeBraceIndex = findMatchingBrace(source, openBraceIndex);

    if (closeBraceIndex === -1) {
      diagnostics.push({
        message: `class ${className} 缺少结束花括号。`,
        line: lineNumberAt(source, match.index),
      });
      continue;
    }

    const body = source.slice(openBraceIndex + 1, closeBraceIndex);
    classes.push({
      id: createNodeId('class', className, classes.length),
      name: className,
      methods: parseMethods(body, source.slice(0, openBraceIndex + 1).split('\n').length, diagnostics),
    });

    classRegex.lastIndex = closeBraceIndex + 1;
  }

  return classes;
}

function parseMethods(
  classBody: string,
  classBodyStartLine: number,
  diagnostics: CSharpDiagnostic[],
): CSharpMethodDeclaration[] {
  const methods: CSharpMethodDeclaration[] = [];
  const methodRegex =
    /((?:(?:public|private|protected|internal|static|async|virtual|override|sealed)\s+)+)([A-Za-z_][\w<>\[\],.?]*)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = methodRegex.exec(classBody)) !== null) {
    const openBraceIndex = classBody.indexOf('{', match.index);
    const closeBraceIndex = findMatchingBrace(classBody, openBraceIndex);
    const methodName = match[3];

    if (closeBraceIndex === -1) {
      diagnostics.push({
        message: `方法 ${methodName} 缺少结束花括号。`,
        line: classBodyStartLine + lineNumberAt(classBody, match.index) - 1,
      });
      continue;
    }

    const body = classBody.slice(openBraceIndex + 1, closeBraceIndex);
    const modifiers = match[1]
      .trim()
      .split(/\s+/)
      .filter((modifier) => METHOD_MODIFIERS.has(modifier));

    methods.push({
      id: createNodeId('method', methodName, methods.length),
      name: methodName,
      returnType: match[2],
      modifiers,
      parameters: parseParameters(match[4]),
      statements: parseStatements(body, diagnostics, classBodyStartLine + lineNumberAt(classBody, openBraceIndex)),
    });

    methodRegex.lastIndex = closeBraceIndex + 1;
  }

  return methods;
}

function parseParameters(parameterSource: string): CSharpParameter[] {
  return splitTopLevelComma(parameterSource)
    .map((parameter) => parameter.trim())
    .filter(Boolean)
    .map((parameter) => {
      const parts = parameter.split(/\s+/);
      const name = parts.pop() ?? 'value';
      return {
        type: parts.join(' ') || 'object',
        name,
      };
    });
}

function parseStatements(
  body: string,
  diagnostics: CSharpDiagnostic[],
  bodyStartLine: number,
): CSharpStatement[] {
  const statements: CSharpStatement[] = [];
  let cursor = 0;

  while (cursor < body.length) {
    cursor = skipWhitespace(body, cursor);

    if (cursor >= body.length) {
      break;
    }

    if (body.startsWith('//', cursor)) {
      const lineEnd = body.indexOf('\n', cursor);
      const end = lineEnd === -1 ? body.length : lineEnd;
      statements.push({
        id: createNodeId('comment', String(statements.length), statements.length),
        kind: 'comment',
        text: body.slice(cursor + 2, end).trim(),
      });
      cursor = end + 1;
      continue;
    }

    if (body.slice(cursor).match(/^if\s*\(/)) {
      const parsedIf = parseIfStatement(body, cursor, diagnostics, bodyStartLine);
      if (parsedIf) {
        statements.push({
          ...parsedIf.statement,
          id: createNodeId('if', String(statements.length), statements.length),
        });
        cursor = parsedIf.nextCursor;
        continue;
      }
    }

    const statementEnd = body.indexOf(';', cursor);
    if (statementEnd === -1) {
      const text = body.slice(cursor).trim();
      if (text) {
        diagnostics.push({
          message: `无法解析语句：${text}`,
          line: bodyStartLine + lineNumberAt(body, cursor) - 1,
        });
        statements.push(toUnknownStatement(text, statements.length));
      }
      break;
    }

    const text = body.slice(cursor, statementEnd).trim();
    if (text) {
      statements.push(parseSimpleStatement(text, statements.length));
    }
    cursor = statementEnd + 1;
  }

  return statements;
}

function parseIfStatement(
  body: string,
  cursor: number,
  diagnostics: CSharpDiagnostic[],
  bodyStartLine: number,
): { statement: CSharpStatement & { kind: 'if' }; nextCursor: number } | null {
  const ifMatch = body.slice(cursor).match(/^if\s*\(/);
  if (!ifMatch) {
    return null;
  }

  const conditionOpenIndex = body.indexOf('(', cursor);
  const conditionCloseIndex = findMatchingParen(body, conditionOpenIndex);
  if (conditionCloseIndex === -1) {
    diagnostics.push({
      message: 'if 条件缺少结束括号。',
      line: bodyStartLine + lineNumberAt(body, cursor) - 1,
    });
    return null;
  }

  const openBraceIndex = skipWhitespace(body, conditionCloseIndex + 1);
  if (body[openBraceIndex] !== '{') {
    return null;
  }

  const closeBraceIndex = findMatchingBrace(body, openBraceIndex);
  if (closeBraceIndex === -1) {
    diagnostics.push({
      message: 'if 语句缺少结束花括号。',
      line: bodyStartLine + lineNumberAt(body, cursor) - 1,
    });
    return null;
  }

  let nextCursor = closeBraceIndex + 1;
  let elseStatements: CSharpStatement[] = [];
  const elseStart = skipWhitespace(body, nextCursor);

  if (body.startsWith('else', elseStart)) {
    const elseOpenBraceIndex = body.indexOf('{', elseStart);
    if (elseOpenBraceIndex !== -1) {
      const elseCloseBraceIndex = findMatchingBrace(body, elseOpenBraceIndex);
      if (elseCloseBraceIndex !== -1) {
        elseStatements = parseStatements(
          body.slice(elseOpenBraceIndex + 1, elseCloseBraceIndex),
          diagnostics,
          bodyStartLine + lineNumberAt(body, elseOpenBraceIndex),
        );
        nextCursor = elseCloseBraceIndex + 1;
      }
    }
  }

  return {
    statement: {
      id: '',
      kind: 'if',
      condition: body.slice(conditionOpenIndex + 1, conditionCloseIndex).trim(),
      thenStatements: parseStatements(
        body.slice(openBraceIndex + 1, closeBraceIndex),
        diagnostics,
        bodyStartLine + lineNumberAt(body, openBraceIndex),
      ),
      elseStatements,
    },
    nextCursor,
  };
}

function findMatchingParen(source: string, openParenIndex: number): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = openParenIndex; index < source.length; index += 1) {
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

function parseSimpleStatement(text: string, index: number): CSharpStatement {
  const returnMatch = text.match(/^return(?:\s+(.+))?$/);
  if (returnMatch) {
    return {
      id: createNodeId('return', String(index), index),
      kind: 'return',
      expression: returnMatch[1]?.trim() ?? '',
    };
  }

  const variableMatch = text.match(/^([A-Za-z_][\w<>\[\],.?]*)\s+([A-Za-z_]\w*)\s*(?:=\s*(.+))?$/);
  if (variableMatch && !variableMatch[1].includes('.')) {
    return {
      id: createNodeId('variable', variableMatch[2], index),
      kind: 'variable',
      type: variableMatch[1],
      name: variableMatch[2],
      initializer: variableMatch[3]?.trim() ?? '',
    };
  }

  const assignmentMatch = text.match(/^([A-Za-z_][\w.]*)\s*=\s*(.+)$/);
  if (assignmentMatch) {
    return {
      id: createNodeId('assignment', assignmentMatch[1], index),
      kind: 'assignment',
      target: assignmentMatch[1],
      expression: assignmentMatch[2].trim(),
    };
  }

  const callMatch = text.match(/^([A-Za-z_][\w.]*)\s*\((.*)\)$/);
  if (callMatch) {
    return {
      id: createNodeId('call', callMatch[1], index),
      kind: 'call',
      callee: callMatch[1],
      arguments: splitArguments(callMatch[2]),
    };
  }

  return toUnknownStatement(text, index);
}

function splitArguments(source: string): string[] {
  return splitTopLevelComma(source);
}

function toUnknownStatement(text: string, index: number): CSharpStatement {
  return {
    id: createNodeId('unknown', String(index), index),
    kind: 'unknown',
    text,
  };
}

function skipWhitespace(source: string, cursor: number): number {
  let next = cursor;
  while (next < source.length && /\s/.test(source[next])) {
    next += 1;
  }
  return next;
}

function findMatchingBrace(source: string, openBraceIndex: number): number {
  let depth = 0;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    }

    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function lineNumberAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function createNodeId(prefix: string, name: string, index: number): string {
  return `${prefix}-${sanitizeIdPart(name)}-${index}`;
}

function sanitizeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'node';
}
