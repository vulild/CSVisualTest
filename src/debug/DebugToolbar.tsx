/*
 * 功能名称：IDE 启动调试工具栏
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import type { DebugState } from './debugTypes';

interface DebugToolbarProps {
  state: DebugState;
  breakpoints: number[];
  onRun: () => void;
  onDebug: () => void;
  onContinue: () => void;
  onStep: () => void;
  onStop: () => void;
}

export function DebugToolbar({
  state,
  breakpoints,
  onRun,
  onDebug,
  onContinue,
  onStep,
  onStop,
}: DebugToolbarProps) {
  const hasActiveSession = state === 'Paused' || state === 'Running';

  return (
    <section className="debug-toolbar" aria-label="IDE 运行调试工具栏">
      <div>
        <strong>运行与调试</strong>
        <span>{breakpoints.length} 个断点</span>
        <span>状态：{state}</span>
      </div>
      <div className="debug-actions">
        <button type="button" onClick={onRun}>
          启动
        </button>
        <button type="button" onClick={onDebug}>
          调试
        </button>
        <button type="button" onClick={onContinue} disabled={!hasActiveSession}>
          继续
        </button>
        <button type="button" onClick={onStep} disabled={!hasActiveSession}>
          单步
        </button>
        <button type="button" onClick={onStop} disabled={!hasActiveSession}>
          停止
        </button>
      </div>
    </section>
  );
}
