/*
 * 功能名称：C# 代码编辑器面板
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { ChangeEvent } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <section className="panel code-panel" aria-labelledby="code-editor-title">
      <div className="panel-header">
        <div>
          <h2 id="code-editor-title">C# 代码</h2>
          <p>编辑代码后，右侧方块会实时重新解析。</p>
        </div>
      </div>
      <textarea
        aria-label="C# 代码编辑器"
        className="code-editor"
        spellCheck={false}
        value={value}
        onChange={handleChange}
      />
    </section>
  );
}
