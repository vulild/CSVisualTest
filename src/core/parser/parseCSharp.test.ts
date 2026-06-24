/*
 * 功能名称：C# 子集语法解析器单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CSHARP_CODE, parseCSharp } from './parseCSharp';

describe('parseCSharp', () => {
  it('解析 using、namespace、class、method 和常见语句', () => {
    const program = parseCSharp(DEFAULT_CSHARP_CODE);
    const method = program.classes[0].methods[0];

    expect(program.usings).toEqual(['System']);
    expect(program.namespaceName).toBe('DemoApp');
    expect(program.classes[0].name).toBe('Greeter');
    expect(method.name).toBe('SayHello');
    expect(method.parameters).toEqual([{ type: 'string', name: 'name' }]);
    expect(method.statements.map((statement) => statement.kind)).toEqual(['variable', 'call', 'if', 'return']);
  });

  it('在缺少 class 时返回诊断信息', () => {
    const program = parseCSharp('using System;');

    expect(program.classes).toHaveLength(0);
    expect(program.diagnostics[0].message).toContain('未找到 class');
  });
});
