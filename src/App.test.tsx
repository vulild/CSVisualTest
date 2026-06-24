/*
 * 功能名称：C# 方块式 IDE 界面交互单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('修改方块字段后实时同步代码编辑器', async () => {
    const user = userEvent.setup();
    render(<App />);

    const classNameInput = screen.getByLabelText('类-名称');
    await user.clear(classNameInput);
    await user.type(classNameInput, 'VisualGreeter');

    expect(screen.getByLabelText('C# 代码编辑器')).toHaveValue(expect.stringContaining('public class VisualGreeter'));
  });

  it('修改代码后实时同步可视化方块', async () => {
    const user = userEvent.setup();
    render(<App />);

    const editor = screen.getByLabelText('C# 代码编辑器');
    await user.clear(editor);
    await user.type(
      editor,
      `using System;

namespace DemoApp
{{
    public class Robot
    {{
        public void Run()
        {{
            Console.WriteLine("go");
        }}
    }}
}}
`,
    );

    expect(screen.getByDisplayValue('Robot')).toBeInTheDocument();
  });
});
