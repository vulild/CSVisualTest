/*
 * 功能名称：常用 C# 语法拖拽工具箱
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { DragEvent } from 'react';
import { COMMON_SYNTAX_TOOLS, type ToolboxItem } from './blockModel';

export const TOOLBOX_DRAG_MIME = 'application/csvisual-toolbox-item';

export function BlockToolbox() {
  const handleDragStart = (event: DragEvent<HTMLButtonElement>, item: ToolboxItem) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(TOOLBOX_DRAG_MIME, JSON.stringify(item));
  };

  return (
    <aside className="block-toolbox" aria-label="常用语法工具箱">
      <div className="toolbox-heading">
        <h3>工具箱</h3>
        <p>拖到方块插入线新增语句。</p>
      </div>
      <div className="toolbox-list">
        {COMMON_SYNTAX_TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="toolbox-item"
            draggable
            title={item.description}
            aria-label={`${item.label}：${item.description}`}
            onDragStart={(event) => handleDragStart(event, item)}
          >
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>
    </aside>
  );
}
