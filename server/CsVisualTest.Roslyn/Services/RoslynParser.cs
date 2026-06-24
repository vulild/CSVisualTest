/*
 * 功能名称：Roslyn C# 全语法解析服务
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace CsVisualTest.Roslyn.Services;

public sealed class RoslynParser
{
    private const int PreviewTextLimit = 120;

    private static readonly CSharpParseOptions ParseOptions = CSharpParseOptions.Default
        .WithLanguageVersion(LanguageVersion.Preview)
        .WithKind(SourceCodeKind.Regular);

    public RoslynParseResponse Parse(string source)
    {
        var syntaxTree = CSharpSyntaxTree.ParseText(source ?? string.Empty, ParseOptions);
        var root = syntaxTree.GetRoot();
        var diagnostics = syntaxTree.GetDiagnostics()
            .Select(diagnostic => ToDiagnosticDto(diagnostic, syntaxTree))
            .ToArray();

        return new RoslynParseResponse(
            ParseOptions.LanguageVersion.ToDisplayString(),
            diagnostics.Any(diagnostic => diagnostic.Severity == "Error"),
            diagnostics,
            ToNodeDto(root));
    }

    private static RoslynDiagnosticDto ToDiagnosticDto(Diagnostic diagnostic, SyntaxTree syntaxTree)
    {
        var lineSpan = syntaxTree.GetLineSpan(diagnostic.Location.SourceSpan);

        return new RoslynDiagnosticDto(
            diagnostic.Id,
            diagnostic.Severity.ToString(),
            diagnostic.GetMessage(),
            diagnostic.Location.SourceSpan.Start,
            diagnostic.Location.SourceSpan.End,
            lineSpan.StartLinePosition.Line + 1,
            lineSpan.StartLinePosition.Character + 1);
    }

    private static RoslynSyntaxNodeDto ToNodeDto(SyntaxNode node)
    {
        var children = node.ChildNodesAndTokens()
            .Select(child => child.IsNode ? ToNodeDto(child.AsNode()!) : ToTokenDto(child.AsToken()))
            .ToArray();

        return new RoslynSyntaxNodeDto(
            node.Kind().ToString(),
            false,
            ToPreviewText(node.ToString()),
            node.SpanStart,
            node.Span.End,
            children);
    }

    private static RoslynSyntaxNodeDto ToTokenDto(SyntaxToken token)
    {
        var triviaChildren = token.LeadingTrivia
            .Concat(token.TrailingTrivia)
            .Where(trivia => trivia.HasStructure)
            .Select(trivia => ToNodeDto(trivia.GetStructure()!))
            .ToArray();

        return new RoslynSyntaxNodeDto(
            token.Kind().ToString(),
            true,
            ToPreviewText(token.Text),
            token.SpanStart,
            token.Span.End,
            triviaChildren);
    }

    private static string ToPreviewText(string text)
    {
        var normalized = text.Replace("\r", string.Empty).Replace("\n", "\\n");
        return normalized.Length <= PreviewTextLimit ? normalized : $"{normalized[..PreviewTextLimit]}...";
    }
}
