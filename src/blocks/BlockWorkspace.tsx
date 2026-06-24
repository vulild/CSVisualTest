/*
 * 功能名称：Scratch 风格可视化方块工作区
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { ChangeEvent } from 'react';
import type { StatementBlockType, VisualBlock } from './blockModel';

interface BlockWorkspaceProps {
  blocks: VisualBlock[];
  onFieldChange: (blockId: string, fieldName: string, value: string) => void;
  onAddStatement: (parentId: string, statementType: StatementBlockType) => void;
  onDeleteBlock: (blockId: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: '名称',
  modifiers: '修饰符',
  returnType: '返回类型',
  parameters: '参数',
  text: '文本',
  type: '类型',
  initializer: '初始值',
  target: '目标',
  expression: '表达式',
  callee: '调用对象',
  arguments: '参数值',
  condition: '条件',
};

const STATEMENT_OPTIONS: Array<{ type: StatementBlockType; label: string }> = [
  { type: 'variable', label: '变量' },
  { type: 'assignment', label: '赋值' },
  { type: 'call', label: '调用' },
  { type: 'if', label: '如果' },
  { type: 'return', label: '返回' },
  { type: 'comment', label: '注释' },
];

export function BlockWorkspace({
  blocks,
  onFieldChange,
  onAddStatement,
  onDeleteBlock,
}: BlockWorkspaceProps) {
  return (
    <section className="panel blocks-panel" aria-labelledby="blocks-title">
      <div className="panel-header">
        <div>
          <h2 id="blocks-title">可视化方块</h2>
          <p>编辑方块字段后，左侧 C# 代码会实时更新。</p>
        </div>
      </div>
      <div className="block-canvas">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            depth={0}
            onFieldChange={onFieldChange}
            onAddStatement={onAddStatement}
            onDeleteBlock={onDeleteBlock}
          />
        ))}
      </div>
    </section>
  );
}

interface BlockCardProps extends Omit<BlockWorkspaceProps, 'blocks'> {
  block: VisualBlock;
  depth: number;
}

function BlockCard({ block, depth, onFieldChange, onAddStatement, onDeleteBlock }: BlockCardProps) {
  const canContainStatements = block.type === 'method' || block.type === 'if';
  const canDelete = ['comment', 'variable', 'assignment', 'call', 'if', 'return', 'unknown'].includes(block.type);

  return (
    <article className={`visual-block block-${block.type}`} style={{ marginLeft: `${depth * 14}px` }}>
      <div className="block-title-row">
        <strong>{block.label}</strong>
        <span className="block-type">{block.type}</span>
        {canDelete ? (
          <button type="button" className="ghost-button danger" onClick={() => onDeleteBlock(block.id)}>
            删除
          </button>
        ) : null}
      </div>

      {Object.entries(block.fields).length > 0 ? (
        <div className="block-fields">
          {Object.entries(block.fields).map(([fieldName, value]) => (
            <label key={fieldName} className="block-field">
              <span>{FIELD_LABELS[fieldName] ?? fieldName}</span>
              <input
                aria-label={`${block.label}-${FIELD_LABELS[fieldName] ?? fieldName}`}
                value={value}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onFieldChange(block.id, fieldName, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      ) : null}

      {canContainStatements ? (
        <div className="block-actions" aria-label={`${block.label} 添加语句`}>
          {STATEMENT_OPTIONS.map((option) => (
            <button key={option.type} type="button" onClick={() => onAddStatement(block.id, option.type)}>
              + {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {block.children.length > 0 ? (
        <div className="block-children">
          {block.children.map((child) => (
            <BlockCard
              key={child.id}
              block={child}
              depth={depth + 1}
              onFieldChange={onFieldChange}
              onAddStatement={onAddStatement}
              onDeleteBlock={onDeleteBlock}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
