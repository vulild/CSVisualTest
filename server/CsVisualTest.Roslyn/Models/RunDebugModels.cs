/*
 * 功能名称：C# 运行与调试 API 数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
namespace CsVisualTest.Roslyn.Models;

public sealed record CSharpRunRequest(string Source);

public sealed record CSharpRunResponse(
    bool Success,
    int ExitCode,
    IReadOnlyList<IdeOutputLineDto> Output,
    IReadOnlyList<CSharpDiagnosticMarkerDto> Diagnostics);

public sealed record IdeOutputLineDto(string Stream, string Text);

public sealed record DebugStartRequest(string Source, IReadOnlyList<int> Breakpoints);

public sealed record DebugActionRequest(string SessionId);

public sealed record DebugSessionDto(
    string SessionId,
    string State,
    int? CurrentLine,
    bool HitBreakpoint,
    IReadOnlyList<VariableDto> Variables,
    IReadOnlyList<IdeOutputLineDto> Output);

public sealed record VariableDto(string Name, string Type, string Value);
