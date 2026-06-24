/*
 * 功能名称：IDE 输出面板
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { IdeOutputLine } from './debugTypes';

interface OutputPanelProps {
  lines: IdeOutputLine[];
}

export function OutputPanel({ lines }: OutputPanelProps) {
  return (
    <section className="panel ide-output-panel" aria-labelledby="output-title">
      <div className="panel-header">
        <div>
          <h2 id="output-title">输出面板</h2>
          <p>显示启动、编译、调试和程序输出。</p>
        </div>
      </div>
      <div className="output-console" role="log" aria-label="IDE 输出">
        {lines.length === 0 ? (
          <span className="output-empty">暂无输出。点击“启动”或“调试”开始。</span>
        ) : (
          lines.map((line, index) => (
            <div key={`${line.stream}-${index}`} className={`output-line output-${line.stream}`}>
              <span>{line.stream}</span>
              <code>{line.text}</code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
