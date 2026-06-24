/*
 * 功能名称：Monaco C# 代码编辑器面板
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import type * as Monaco from 'monaco-editor';
import { getCSharpDiagnostics } from './csharpLspClient';
import { registerCSharpLanguage } from './monacoCSharpLsp';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  const handleBeforeMount = (monaco: typeof Monaco) => {
    registerCSharpLanguage(monaco);
  };

  const handleMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor?.getModel();

    if (!monaco || !model) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      const diagnostics = await getCSharpDiagnostics(value, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      monaco.editor.setModelMarkers(
        model,
        'roslyn-csharp-lsp',
        diagnostics.map((diagnostic) => ({
          message: diagnostic.message,
          severity: toMonacoSeverity(monaco, diagnostic.severity),
          startLineNumber: diagnostic.startLineNumber,
          startColumn: diagnostic.startColumn,
          endLineNumber: diagnostic.endLineNumber,
          endColumn: Math.max(diagnostic.endColumn, diagnostic.startColumn + 1),
          code: diagnostic.id,
          source: 'Roslyn C# LSP',
        })),
      );
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <section className="panel code-panel" aria-labelledby="code-editor-title">
      <div className="panel-header">
        <div>
          <h2 id="code-editor-title">C# 代码（Monaco + Roslyn LSP）</h2>
          <p>编辑代码后，右侧方块会实时重新解析；补全、悬停和诊断由 Roslyn 提供。</p>
        </div>
      </div>
      <div className="monaco-shell">
        <Editor
          height="590px"
          language="csharp"
          theme="vs-dark"
          value={value}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          options={{
            ariaLabel: 'C# 代码编辑器',
            automaticLayout: true,
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 4,
          }}
        />
      </div>
    </section>
  );
}

function toMonacoSeverity(monaco: typeof Monaco, severity: string): Monaco.MarkerSeverity {
  switch (severity) {
    case 'Error':
      return monaco.MarkerSeverity.Error;
    case 'Warning':
      return monaco.MarkerSeverity.Warning;
    case 'Info':
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Hint;
  }
}
