/*
 * 功能名称：C# 方块式 IDE 应用主体
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { useMemo, useState } from 'react';
import { BlockWorkspace } from './blocks/BlockWorkspace';
import type { StatementBlockType, VisualBlock } from './blocks/blockModel';
import { DEFAULT_CSHARP_CODE } from './core/parser/parseCSharp';
import { CodeEditor } from './editor/CodeEditor';
import {
  addStatementBlock,
  deleteBlock,
  syncFromBlocks,
  syncFromCode,
  updateBlockField,
} from './sync/SyncEngine';
import './App.css';

export function App() {
  const initialState = useMemo(() => syncFromCode(DEFAULT_CSHARP_CODE), []);
  const [code, setCode] = useState(initialState.code);
  const [blocks, setBlocks] = useState<VisualBlock[]>(initialState.blocks);
  const [diagnostics, setDiagnostics] = useState<string[]>(initialState.diagnostics);

  const handleCodeChange = (nextCode: string) => {
    const result = syncFromCode(nextCode);
    setCode(result.code);
    setBlocks(result.blocks);
    setDiagnostics(result.diagnostics);
  };

  const commitBlocks = (nextBlocks: VisualBlock[]) => {
    const result = syncFromBlocks(nextBlocks);
    setCode(result.code);
    setBlocks(result.blocks);
    setDiagnostics(result.diagnostics);
  };

  const handleFieldChange = (blockId: string, fieldName: string, value: string) => {
    commitBlocks(updateBlockField(blocks, blockId, fieldName, value));
  };

  const handleAddStatement = (parentId: string, statementType: StatementBlockType) => {
    commitBlocks(addStatementBlock(blocks, parentId, statementType));
  };

  const handleDeleteBlock = (blockId: string) => {
    commitBlocks(deleteBlock(blocks, blockId));
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">CSVisualTest</p>
          <h1>C# 方块式 IDE</h1>
          <p>
            通过统一 AST 在文本代码和 Scratch 风格方块之间实时同步，适合学习 C# 基础语法和可视化编程。
          </p>
        </div>
      </header>

      {diagnostics.length > 0 ? (
        <aside className="diagnostics" aria-label="解析诊断">
          <strong>解析提示</strong>
          <ul>
            {diagnostics.map((diagnostic) => (
              <li key={diagnostic}>{diagnostic}</li>
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="workspace-grid">
        <CodeEditor value={code} onChange={handleCodeChange} />
        <BlockWorkspace
          blocks={blocks}
          onFieldChange={handleFieldChange}
          onAddStatement={handleAddStatement}
          onDeleteBlock={handleDeleteBlock}
        />
      </div>
    </main>
  );
}
