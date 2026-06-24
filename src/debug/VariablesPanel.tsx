/*
 * 功能名称：IDE 变量监控面板
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { VariableInfo } from './debugTypes';

interface VariablesPanelProps {
  variables: VariableInfo[];
  currentLine: number | null;
}

export function VariablesPanel({ variables, currentLine }: VariablesPanelProps) {
  return (
    <section className="panel variables-panel" aria-labelledby="variables-title">
      <div className="panel-header">
        <div>
          <h2 id="variables-title">变量监控</h2>
          <p>{currentLine ? `当前暂停在第 ${currentLine} 行。` : '调试暂停后显示变量。'}</p>
        </div>
      </div>
      <div className="variables-table" aria-label="变量监控列表">
        <div className="variables-row variables-head">
          <span>名称</span>
          <span>类型</span>
          <span>值</span>
        </div>
        {variables.length === 0 ? (
          <div className="variables-empty">暂无变量。</div>
        ) : (
          variables.map((variable) => (
            <div key={variable.name} className="variables-row">
              <span>{variable.name}</span>
              <span>{variable.type}</span>
              <code>{variable.value}</code>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
