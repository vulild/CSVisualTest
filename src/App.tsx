/*
 * 功能名称：C# 方块式 IDE 应用主体
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { useEffect, useMemo, useState } from 'react';
import { BlockWorkspace } from './blocks/BlockWorkspace';
import { FlowchartView } from './blocks/FlowchartView';
import { RoslynSyntaxTreePanel } from './blocks/RoslynSyntaxTreePanel';
import type { StatementBlockType, ToolboxItem, VisualBlock } from './blocks/blockModel';
import { DEFAULT_CSHARP_CODE } from './core/parser/parseCSharp';
import { parseCSharpWithRoslyn } from './core/parser/parseCSharpRoslyn';
import type { RoslynParseResponse } from './core/parser/RoslynSyntax';
import {
  continueDebugSession,
  runCSharpCode,
  startDebugSession,
  stepDebugSession,
  stopDebugSession,
} from './debug/debugClient';
import { DebugToolbar } from './debug/DebugToolbar';
import type { DebugSession, DebugState, IdeOutputLine, VariableInfo } from './debug/debugTypes';
import { OutputPanel } from './debug/OutputPanel';
import { VariablesPanel } from './debug/VariablesPanel';
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
  const [workspaceTab, setWorkspaceTab] = useState<'code' | 'visual'>('code');
  const [visualMode, setVisualMode] = useState<'blocks' | 'flowchart'>('blocks');
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [debugState, setDebugState] = useState<DebugState>('Idle');
  const [debugSessionId, setDebugSessionId] = useState('');
  const [currentDebugLine, setCurrentDebugLine] = useState<number | null>(null);
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [outputLines, setOutputLines] = useState<IdeOutputLine[]>([]);

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

  const applyDebugSession = (session: DebugSession) => {
    setDebugSessionId(session.sessionId);
    setDebugState(session.state);
    setCurrentDebugLine(session.currentLine);
    setVariables(session.variables);
    setOutputLines(session.output);
  };

  const handleRun = async () => {
    setDebugState('Running');
    setCurrentDebugLine(null);
    setVariables([]);
    setOutputLines([{ stream: 'stdout', text: '启动 C# 程序...' }]);
    const result = await runCSharpCode(code);
    setDebugState(result.success ? 'Completed' : 'Stopped');
    setOutputLines([
      ...result.output,
      ...result.diagnostics.map((diagnostic) => ({
        stream: 'stderr',
        text: `${diagnostic.id}: ${diagnostic.message}`,
      })),
      { stream: result.success ? 'stdout' : 'stderr', text: `进程退出码：${result.exitCode}` },
    ]);
  };

  const handleDebug = async () => {
    const session = await startDebugSession(code, breakpoints);
    applyDebugSession(session);
    setOutputLines([
      { stream: 'stdout', text: breakpoints.length > 0 ? '调试会话已启动，断点已加载。' : '调试会话已启动。' },
      ...session.output,
    ]);
  };

  const handleContinue = async () => {
    if (!debugSessionId) {
      return;
    }

    applyDebugSession(await continueDebugSession(debugSessionId));
  };

  const handleStep = async () => {
    if (!debugSessionId) {
      return;
    }

    applyDebugSession(await stepDebugSession(debugSessionId));
  };

  const handleStop = async () => {
    if (!debugSessionId) {
      return;
    }

    applyDebugSession(await stopDebugSession(debugSessionId));
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

      <DebugToolbar
        state={debugState}
        breakpoints={breakpoints}
        onRun={handleRun}
        onDebug={handleDebug}
        onContinue={handleContinue}
        onStep={handleStep}
        onStop={handleStop}
      />

      <div className="workspace-tabs" aria-label="代码与可视化工作区">
        <div className="tab-list" role="tablist" aria-label="代码与可视化区域切换">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceTab === 'code'}
            className={workspaceTab === 'code' ? 'active' : ''}
            onClick={() => setWorkspaceTab('code')}
          >
            代码
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceTab === 'visual'}
            className={workspaceTab === 'visual' ? 'active' : ''}
            onClick={() => setWorkspaceTab('visual')}
          >
            可视化
          </button>
        </div>

        {workspaceTab === 'code' ? (
          <div role="tabpanel" aria-label="代码区域">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              breakpoints={breakpoints}
              currentDebugLine={currentDebugLine}
              onBreakpointsChange={setBreakpoints}
            />
          </div>
        ) : (
          <div role="tabpanel" aria-label="可视化区域">
            <div className="visual-mode-tabs" role="tablist" aria-label="可视化方式切换">
              <button
                type="button"
                role="tab"
                aria-selected={visualMode === 'blocks'}
                className={visualMode === 'blocks' ? 'active' : ''}
                onClick={() => setVisualMode('blocks')}
              >
                方块
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visualMode === 'flowchart'}
                className={visualMode === 'flowchart' ? 'active' : ''}
                onClick={() => setVisualMode('flowchart')}
              >
                流程图
              </button>
            </div>

            {visualMode === 'blocks' ? (
              <BlockWorkspace
                blocks={blocks}
                onFieldChange={handleFieldChange}
                onAddStatement={handleAddStatement}
                onInsertStatement={handleInsertStatement}
                onMoveStatement={handleMoveStatement}
                onDeleteBlock={handleDeleteBlock}
              />
            ) : (
              <FlowchartView blocks={blocks} />
            )}
          </div>
        )}
      </div>

      <div className="ide-bottom-grid">
        <OutputPanel lines={outputLines} />
        <VariablesPanel variables={variables} currentLine={currentDebugLine} />
      </div>

      <RoslynSyntaxTreePanel result={roslynResult} status={roslynStatus} />
    </main>
  );
}
