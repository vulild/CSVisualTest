/*
 * 功能名称：Scratch 风格可视化方块工作区
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { ChangeEvent, DragEvent } from 'react';
import { BlockToolbox, TOOLBOX_DRAG_MIME } from './BlockToolbox';
import { COMMON_SYNTAX_TOOLS, type StatementBlockType, type ToolboxItem, type VisualBlock } from './blockModel';

const BLOCK_MOVE_MIME = 'application/csvisual-block-move';

interface BlockWorkspaceProps {
  blocks: VisualBlock[];
  onFieldChange: (blockId: string, fieldName: string, value: string) => void;
  onAddStatement: (parentId: string, statementType: StatementBlockType) => void;
  onInsertStatement: (parentId: string, index: number, item: Pick<ToolboxItem, 'statementType' | 'fields'>) => void;
  onMoveStatement: (parentId: string, fromIndex: number, toIndex: number) => void;
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

export function BlockWorkspace({
  blocks,
  onFieldChange,
  onAddStatement,
  onInsertStatement,
  onMoveStatement,
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
      <div className="visual-programming-layout">
        <BlockToolbox />
        <div className="block-canvas">
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              depth={0}
              onFieldChange={onFieldChange}
              onAddStatement={onAddStatement}
              onInsertStatement={onInsertStatement}
              onMoveStatement={onMoveStatement}
              onDeleteBlock={onDeleteBlock}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface BlockCardProps extends Omit<BlockWorkspaceProps, 'blocks'> {
  block: VisualBlock;
  depth: number;
  parentId?: string;
  index?: number;
}

function BlockCard({
  block,
  depth,
  parentId,
  index,
  onFieldChange,
  onAddStatement,
  onInsertStatement,
  onMoveStatement,
  onDeleteBlock,
}: BlockCardProps) {
  const canContainStatements = block.type === 'method' || block.type === 'if';
  const canDelete =
    parentId !== undefined && ['comment', 'variable', 'assignment', 'call', 'if', 'return', 'unknown'].includes(block.type);
  const canMove = canDelete && parentId !== undefined && index !== undefined;

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    if (!canMove) {
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(BLOCK_MOVE_MIME, JSON.stringify({ parentId, index }));
  };

  return (
    <article
      className={`visual-block block-${block.type}`}
      draggable={canMove}
      style={{ marginLeft: `${depth * 8}px` }}
      onDragStart={handleDragStart}
    >
      <div className="block-title-row">
        {canMove ? <span className="drag-handle" title="拖动调整顺序">↕</span> : null}
        <strong>{block.label}</strong>
        <span className="block-type">{block.type}</span>
        {canDelete ? (
          <button
            type="button"
            className="ghost-button danger compact-delete"
            aria-label={`删除${block.label}`}
            onClick={() => onDeleteBlock(block.id)}
          >
            ×
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
        <details className="block-actions" aria-label={`${block.label} 添加语句`}>
          <summary>+ 添加语句</summary>
          <div className="block-action-list">
            {COMMON_SYNTAX_TOOLS.slice(0, 6).map((option) => (
              <button key={option.id} type="button" onClick={() => onAddStatement(block.id, option.statementType)}>
                {option.label}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      {canContainStatements ? (
        <DropZone
          label="拖放到开头"
          parentId={block.id}
          index={0}
          onInsertStatement={onInsertStatement}
          onMoveStatement={onMoveStatement}
        />
      ) : null}

      {block.children.length > 0 ? (
        <div className="block-children">
          {block.children.map((child, childIndex) => (
            <div key={child.id}>
              <BlockCard
                block={child}
                depth={depth + 1}
                parentId={canContainStatements ? block.id : undefined}
                index={canContainStatements ? childIndex : undefined}
                onFieldChange={onFieldChange}
                onAddStatement={onAddStatement}
                onInsertStatement={onInsertStatement}
                onMoveStatement={onMoveStatement}
                onDeleteBlock={onDeleteBlock}
              />
              {canContainStatements ? (
                <DropZone
                  label={`拖放到第 ${childIndex + 2} 位`}
                  parentId={block.id}
                  index={childIndex + 1}
                  onInsertStatement={onInsertStatement}
                  onMoveStatement={onMoveStatement}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

interface DropZoneProps {
  label: string;
  parentId: string;
  index: number;
  onInsertStatement: (parentId: string, index: number, item: Pick<ToolboxItem, 'statementType' | 'fields'>) => void;
  onMoveStatement: (parentId: string, fromIndex: number, toIndex: number) => void;
}

function DropZone({ label, parentId, index, onInsertStatement, onMoveStatement }: DropZoneProps) {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const toolboxData = event.dataTransfer.getData(TOOLBOX_DRAG_MIME);
    const moveData = event.dataTransfer.getData(BLOCK_MOVE_MIME);

    if (toolboxData) {
      onInsertStatement(parentId, index, JSON.parse(toolboxData) as ToolboxItem);
      return;
    }

    if (moveData) {
      const payload = JSON.parse(moveData) as { parentId: string; index: number };
      if (payload.parentId === parentId) {
        const targetIndex = payload.index < index ? index - 1 : index;
        onMoveStatement(parentId, payload.index, targetIndex);
      }
    }
  };

  return (
    <div
      className="drop-zone"
      role="button"
      tabIndex={0}
      aria-label={label}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {label}
    </div>
  );
}
