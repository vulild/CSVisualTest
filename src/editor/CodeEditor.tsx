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
  breakpoints?: number[];
  currentDebugLine?: number | null;
  onBreakpointsChange?: (breakpoints: number[]) => void;
}

export function CodeEditor({
  value,
  onChange,
  breakpoints = [],
  currentDebugLine = null,
  onBreakpointsChange,
}: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const breakpointsRef = useRef<number[]>(breakpoints);

  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  const handleBeforeMount = (monaco: typeof Monaco) => {
    registerCSharpLanguage(monaco);
  };

  const handleMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.onMouseDown((event) => {
      const isBreakpointTarget =
        event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS;
      const lineNumber = event.target.position?.lineNumber;

      if (!isBreakpointTarget || !lineNumber || !onBreakpointsChange) {
        return;
      }

      const activeBreakpoints = breakpointsRef.current;
      const nextBreakpoints = activeBreakpoints.includes(lineNumber)
        ? activeBreakpoints.filter((line) => line !== lineNumber)
        : [...activeBreakpoints, lineNumber].sort((left, right) => left - right);
      onBreakpointsChange(nextBreakpoints);
    });
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

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) {
      return;
    }

    const decorations: Monaco.editor.IModelDeltaDecoration[] = [
      ...breakpoints.map((lineNumber) => ({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'breakpoint-glyph',
          glyphMarginHoverMessage: { value: `断点：第 ${lineNumber} 行` },
        },
      })),
      ...(currentDebugLine
        ? [
            {
              range: new monaco.Range(currentDebugLine, 1, currentDebugLine, 1),
              options: {
                isWholeLine: true,
                className: 'debug-current-line',
                glyphMarginClassName: 'debug-current-glyph',
              },
            },
          ]
        : []),
    ];

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
  }, [breakpoints, currentDebugLine]);

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
            glyphMargin: true,
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
