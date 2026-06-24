/*
 * 功能名称：Roslyn 全语法树可视化面板
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { RoslynParseResponse, RoslynSyntaxNode } from '../core/parser/RoslynSyntax';

interface RoslynSyntaxTreePanelProps {
  result: RoslynParseResponse | null;
  status: 'idle' | 'loading' | 'ready' | 'unavailable';
}

export function RoslynSyntaxTreePanel({ result, status }: RoslynSyntaxTreePanelProps) {
  return (
    <section className="panel roslyn-panel" aria-labelledby="roslyn-title">
      <div className="panel-header">
        <div>
          <h2 id="roslyn-title">Roslyn 全语法树</h2>
          <p>由后端 Roslyn 解析任意 C# 语法，作为完整语法支持和诊断来源。</p>
        </div>
        <span className={`status-pill status-${status}`}>{statusLabel(status)}</span>
      </div>

      {result ? (
        <>
          <div className="roslyn-summary">
            <span>C# {result.languageVersion}</span>
            <span>{result.hasErrors ? '存在语法错误' : '语法解析通过'}</span>
            <span>{countNodes(result.root)} 个节点/Token</span>
          </div>

          {result.diagnostics.length > 0 ? (
            <ul className="roslyn-diagnostics">
              {result.diagnostics.map((diagnostic) => (
                <li key={`${diagnostic.id}-${diagnostic.start}`}>
                  {diagnostic.severity} {diagnostic.id}：第 {diagnostic.line} 行第 {diagnostic.column} 列，
                  {diagnostic.message}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="roslyn-tree">
            <SyntaxNodeView node={result.root} depth={0} />
          </div>
        </>
      ) : (
        <div className="roslyn-empty">
          {status === 'unavailable'
            ? 'Roslyn 服务未连接，当前仍使用本地可编辑方块引擎。请运行 npm run dev:api 启动后端。'
            : '等待 Roslyn 解析结果...'}
        </div>
      )}
    </section>
  );
}

function SyntaxNodeView({ node, depth }: { node: RoslynSyntaxNode; depth: number }) {
  const preview = node.text ? `：${node.text}` : '';

  return (
    <details className={node.isToken ? 'syntax-token' : 'syntax-node'} open={depth < 2}>
      <summary>
        <span>{node.kind}</span>
        <small>
          {node.isToken ? 'Token' : 'Node'} [{node.spanStart}, {node.spanEnd}){preview}
        </small>
      </summary>
      {node.children.length > 0 ? (
        <div className="syntax-children">
          {node.children.map((child, index) => (
            <SyntaxNodeView key={`${child.kind}-${child.spanStart}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </details>
  );
}

function statusLabel(status: RoslynSyntaxTreePanelProps['status']): string {
  switch (status) {
    case 'idle':
      return '等待解析';
    case 'loading':
      return '解析中';
    case 'ready':
      return '已连接';
    case 'unavailable':
      return '服务未启动';
  }
}

function countNodes(node: RoslynSyntaxNode): number {
  return 1 + node.children.reduce((total, child) => total + countNodes(child), 0);
}
