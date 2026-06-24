/*
 * 功能名称：C# 程序流程图可视化
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { VisualBlock } from './blockModel';

interface FlowchartViewProps {
  blocks: VisualBlock[];
}

const FIELD_LABELS: Record<string, string> = {
  name: '名称',
  modifiers: '修饰符',
  returnType: '返回',
  parameters: '参数',
  text: '文本',
  type: '类型',
  initializer: '初始值',
  target: '目标',
  expression: '表达式',
  callee: '调用',
  arguments: '参数',
  condition: '条件',
};

export function FlowchartView({ blocks }: FlowchartViewProps) {
  return (
    <section className="panel flowchart-panel" aria-labelledby="flowchart-title">
      <div className="panel-header">
        <div>
          <h2 id="flowchart-title">流程图</h2>
          <p>以流程节点展示当前代码结构，适合快速阅读执行路径。</p>
        </div>
      </div>
      <div className="flowchart-canvas" aria-label="流程图可视化">
        <div className="flowchart-track">
          <FlowTerminator label="START" />
          {blocks.map((block) => (
            <FlowNode key={block.id} block={block} depth={0} />
          ))}
          <FlowTerminator label="END" />
        </div>
      </div>
    </section>
  );
}

function FlowNode({ block, depth }: { block: VisualBlock; depth: number }) {
  const flowKind = getFlowKind(block);
  const isDecision = flowKind === 'decision';
  const isGroupedRawSyntax = ['loop', 'switch', 'exception'].includes(flowKind);
  const isContainer = block.children.length > 0;
  const rawLines = block.type === 'unknown' ? toRawFlowLines(block.fields.text) : [];

  return (
    <div className={`flow-node-wrap flow-wrap-${flowKind}`} style={{ marginLeft: `${Math.min(depth, 6) * 12}px` }}>
      {isGroupedRawSyntax ? (
        <section className={`flow-group flow-group-${flowKind}`}>
          <FlowNodeCard block={block} flowKind={flowKind} />
          {rawLines.length > 0 ? (
            <div className="flow-raw-steps">
              {rawLines.map((line, index) => (
                <div key={`${line}-${index}`} className="flow-raw-step">
                  {line}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <FlowNodeCard block={block} flowKind={flowKind} />
      )}

      {isContainer ? (
        <div className={isDecision ? 'flow-branch' : 'flow-sequence'}>
          {isDecision ? <span className="flow-branch-label">True</span> : null}
          {block.children.map((child) => (
            <FlowNode key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlowNodeCard({ block, flowKind }: { block: VisualBlock; flowKind: string }) {
  const visibleFields = getVisibleFields(block);
  const title = getNodeTitle(block);

  return (
    <article className={`flow-node flow-node-${flowKind} flow-${block.type}`}>
      <div className="flow-node-title">
        <strong>{title}</strong>
        <span>{flowKind}</span>
      </div>
      {visibleFields.length > 0 ? (
        <dl className="flow-fields">
          {visibleFields.map(([name, value]) => (
            <div key={name}>
              <dt>{FIELD_LABELS[name] ?? name}</dt>
              <dd>{value || '-'}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

function FlowTerminator({ label }: { label: string }) {
  return <div className="flow-terminator">{label}</div>;
}

function getFlowKind(block: VisualBlock): string {
  if (block.type === 'if') {
    return 'decision';
  }

  if (block.type === 'return') {
    return 'return';
  }

  if (block.type === 'method' || block.type === 'class' || block.type === 'namespace' || block.type === 'program') {
    return 'container';
  }

  if (block.type === 'unknown') {
    const text = block.fields.text?.trim() ?? '';
    if (/^(for|foreach|while)\b/.test(text)) {
      return 'loop';
    }

    if (/^switch\b/.test(text)) {
      return 'switch';
    }

    if (/^try\b/.test(text)) {
      return 'exception';
    }
  }

  return 'process';
}

function getNodeTitle(block: VisualBlock): string {
  if (block.type === 'if') {
    return block.fields.condition || '条件判断';
  }

  if (block.type === 'variable') {
    return `${block.fields.type ?? 'var'} ${block.fields.name ?? 'value'} = ${block.fields.initializer ?? ''}`.trim();
  }

  if (block.type === 'assignment') {
    return `${block.fields.target ?? 'value'} = ${block.fields.expression ?? ''}`.trim();
  }

  if (block.type === 'call') {
    return `${block.fields.callee ?? 'Call'}(${block.fields.arguments ?? ''})`;
  }

  if (block.type === 'return') {
    return `Return ${block.fields.expression ?? ''}`.trim();
  }

  if (block.type === 'unknown') {
    return firstLine(block.fields.text) || '原始语法';
  }

  return block.fields.name || block.label;
}

function getVisibleFields(block: VisualBlock): Array<[string, string]> {
  if (['variable', 'assignment', 'call', 'if', 'return', 'unknown'].includes(block.type)) {
    return [];
  }

  return Object.entries(block.fields);
}

function firstLine(text = ''): string {
  return text.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
}

function toRawFlowLines(text = ''): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== '{' && line !== '}')
    .slice(1, 6);
}
