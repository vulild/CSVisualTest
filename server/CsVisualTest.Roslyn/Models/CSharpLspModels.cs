/*
 * 功能名称：C# LSP 风格语言服务数据模型
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
namespace CsVisualTest.Roslyn.Models;

public sealed record CSharpDocumentRequest(string Source);

public sealed record CSharpPositionRequest(string Source, int Position);

public sealed record CSharpDiagnosticMarkerDto(
    string Id,
    string Message,
    string Severity,
    int StartLineNumber,
    int StartColumn,
    int EndLineNumber,
    int EndColumn);

public sealed record CSharpCompletionResponse(IReadOnlyList<CSharpCompletionItemDto> Items);

public sealed record CSharpCompletionItemDto(
    string Label,
    string Kind,
    string Detail,
    string InsertText,
    string SortText);

public sealed record CSharpHoverResponse(
    string Contents,
    int Start,
    int End);
