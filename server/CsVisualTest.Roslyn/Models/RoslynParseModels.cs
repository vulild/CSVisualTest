/*
 * 功能名称：Roslyn C# 语法解析 API 数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
namespace CsVisualTest.Roslyn.Models;

public sealed record RoslynParseRequest(string Source);

public sealed record RoslynParseResponse(
    string LanguageVersion,
    bool HasErrors,
    IReadOnlyList<RoslynDiagnosticDto> Diagnostics,
    RoslynSyntaxNodeDto Root);

public sealed record RoslynDiagnosticDto(
    string Id,
    string Severity,
    string Message,
    int Start,
    int End,
    int Line,
    int Column);

public sealed record RoslynSyntaxNodeDto(
    string Kind,
    bool IsToken,
    string Text,
    int SpanStart,
    int SpanEnd,
    IReadOnlyList<RoslynSyntaxNodeDto> Children);
