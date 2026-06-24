/*
 * 功能名称：C# 方块式 IDE 应用主体
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { useEffect, useMemo, useState } from 'react';
import { BlockWorkspace } from './blocks/BlockWorkspace';
import { RoslynSyntaxTreePanel } from './blocks/RoslynSyntaxTreePanel';
import type { StatementBlockType, ToolboxItem, VisualBlock } from './blocks/blockModel';
import { DEFAULT_CSHARP_CODE } from './core/parser/parseCSharp';
import { parseCSharpWithRoslyn } from './core/parser/parseCSharpRoslyn';
import type { RoslynParseResponse } from './core/parser/RoslynSyntax';
import { CodeEditor } from './editor/CodeEditor';
import {
  addStatementBlock,
  deleteBlock,
  insertStatementBlock,
  moveStatementBlock,
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
  const [roslynResult, setRoslynResult] = useState<RoslynParseResponse | null>(null);
  const [roslynStatus, setRoslynStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setRoslynStatus('loading');
      const result = await parseCSharpWithRoslyn(code, controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      setRoslynResult(result);
      setRoslynStatus(result ? 'ready' : 'unavailable');
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [code]);

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

  const handleInsertStatement = (parentId: string, index: number, item: Pick<ToolboxItem, 'statementType' | 'fields'>) => {
    commitBlocks(insertStatementBlock(blocks, parentId, index, item));
  };

  const handleMoveStatement = (parentId: string, fromIndex: number, toIndex: number) => {
    commitBlocks(moveStatementBlock(blocks, parentId, fromIndex, toIndex));
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
          onInsertStatement={handleInsertStatement}
          onMoveStatement={handleMoveStatement}
          onDeleteBlock={handleDeleteBlock}
        />
      </div>

      <RoslynSyntaxTreePanel result={roslynResult} status={roslynStatus} />
    </main>
  );
}
