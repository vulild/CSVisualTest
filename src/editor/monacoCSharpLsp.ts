/*
 * 功能名称：Monaco C# LSP 风格语言服务注册
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type * as Monaco from 'monaco-editor';
import { getCSharpCompletions, getCSharpHover, type CSharpCompletionItem } from './csharpLspClient';

let languageRegistered = false;
let providersRegistered = false;

export function registerCSharpLanguage(monaco: typeof Monaco) {
  if (!languageRegistered) {
    monaco.languages.register({ id: 'csharp', extensions: ['.cs'], aliases: ['C#', 'csharp'] });
    monaco.languages.setLanguageConfiguration('csharp', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    });
    monaco.languages.setMonarchTokensProvider('csharp', {
      keywords: [
        'abstract',
        'as',
        'async',
        'await',
        'base',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'default',
        'delegate',
        'do',
        'else',
        'enum',
        'event',
        'false',
        'finally',
        'for',
        'foreach',
        'if',
        'in',
        'interface',
        'internal',
        'is',
        'namespace',
        'new',
        'null',
        'private',
        'protected',
        'public',
        'readonly',
        'record',
        'return',
        'sealed',
        'static',
        'struct',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'using',
        'var',
        'virtual',
        'void',
        'while',
      ],
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+/, 'number'],
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
      },
    });
    languageRegistered = true;
  }

  if (providersRegistered) {
    return;
  }

  monaco.languages.registerCompletionItemProvider('csharp', {
    triggerCharacters: ['.', ' ', '('],
    async provideCompletionItems(model, position) {
      const response = await getCSharpCompletions(model.getValue(), model.getOffsetAt(position));
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

      return {
        suggestions: response.items.map((item) => toMonacoCompletionItem(monaco, item, range)),
      };
    },
  });

  monaco.languages.registerHoverProvider('csharp', {
    async provideHover(model, position) {
      const hover = await getCSharpHover(model.getValue(), model.getOffsetAt(position));
      if (!hover) {
        return null;
      }

      const start = model.getPositionAt(hover.start);
      const end = model.getPositionAt(hover.end);
      return {
        contents: [{ value: `\`\`\`csharp\n${hover.contents}\n\`\`\`` }],
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
      };
    },
  });

  providersRegistered = true;
}

function toMonacoCompletionItem(
  monaco: typeof Monaco,
  item: CSharpCompletionItem,
  range: Monaco.IRange,
): Monaco.languages.CompletionItem {
  return {
    label: item.label,
    kind: toCompletionItemKind(monaco, item.kind),
    detail: item.detail,
    insertText: item.insertText,
    sortText: item.sortText,
    range,
  };
}

function toCompletionItemKind(monaco: typeof Monaco, kind: string): Monaco.languages.CompletionItemKind {
  const normalized = kind.toLowerCase();

  if (normalized.includes('method')) {
    return monaco.languages.CompletionItemKind.Method;
  }

  if (normalized.includes('property')) {
    return monaco.languages.CompletionItemKind.Property;
  }

  if (normalized.includes('class')) {
    return monaco.languages.CompletionItemKind.Class;
  }

  if (normalized.includes('keyword')) {
    return monaco.languages.CompletionItemKind.Keyword;
  }

  return monaco.languages.CompletionItemKind.Text;
}
