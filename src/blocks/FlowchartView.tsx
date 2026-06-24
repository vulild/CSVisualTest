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
        {blocks.map((block) => (
          <FlowNode key={block.id} block={block} depth={0} />
        ))}
      </div>
    </section>
  );
}

function FlowNode({ block, depth }: { block: VisualBlock; depth: number }) {
  const isDecision = block.type === 'if';
  const isContainer = block.children.length > 0;

  return (
    <div className="flow-node-wrap" style={{ marginLeft: `${Math.min(depth, 6) * 14}px` }}>
      <article className={`flow-node flow-${block.type} ${isDecision ? 'flow-decision' : ''}`}>
        <div className="flow-node-title">
          <strong>{block.label}</strong>
          <span>{block.type}</span>
        </div>
        {Object.keys(block.fields).length > 0 ? (
          <dl className="flow-fields">
            {Object.entries(block.fields).map(([name, value]) => (
              <div key={name}>
                <dt>{FIELD_LABELS[name] ?? name}</dt>
                <dd>{value || '-'}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </article>

      {isContainer ? (
        <div className={isDecision ? 'flow-branch' : 'flow-sequence'}>
          {block.children.map((child) => (
            <FlowNode key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
