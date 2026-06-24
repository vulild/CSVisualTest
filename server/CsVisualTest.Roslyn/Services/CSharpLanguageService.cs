/*
 * 功能名称：Roslyn C# LSP 风格语言服务
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Completion;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Host.Mef;
using Microsoft.CodeAnalysis.Text;
using System.Reflection;

namespace CsVisualTest.Roslyn.Services;

public sealed class CSharpLanguageService
{
    private static readonly CSharpParseOptions ParseOptions = CSharpParseOptions.Default
        .WithLanguageVersion(LanguageVersion.Preview);

    private static readonly CSharpCompilationOptions CompilationOptions = new(OutputKind.DynamicallyLinkedLibrary);

    private static readonly MetadataReference[] MetadataReferences = GetTrustedPlatformReferences();

    private static readonly MefHostServices HostServices = MefHostServices.Create(
        MefHostServices.DefaultAssemblies.Concat(new[]
        {
            Assembly.Load("Microsoft.CodeAnalysis.CSharp.Workspaces"),
            Assembly.Load("Microsoft.CodeAnalysis.CSharp.Features"),
        }));

    public IReadOnlyList<CSharpDiagnosticMarkerDto> GetDiagnostics(string source)
    {
        var syntaxTree = CSharpSyntaxTree.ParseText(source ?? string.Empty, ParseOptions);

        return syntaxTree.GetDiagnostics()
            .Select(diagnostic => ToMarker(diagnostic, syntaxTree))
            .ToArray();
    }

    public async Task<CSharpCompletionResponse> GetCompletionsAsync(string source, int position)
    {
        var document = CreateDocument(source);
        var completionService = CompletionService.GetService(document);
        if (completionService is null)
        {
            return new CSharpCompletionResponse(Array.Empty<CSharpCompletionItemDto>());
        }

        var normalizedPosition = NormalizePosition(source, position);
        var completions = await completionService.GetCompletionsAsync(document, normalizedPosition);
        var items = completions?.ItemsList
            .Take(80)
            .Select(item => new CSharpCompletionItemDto(
                item.DisplayText,
                item.Tags.FirstOrDefault() ?? "Text",
                item.InlineDescription ?? string.Empty,
                item.DisplayText,
                item.SortText))
            .ToArray() ?? Array.Empty<CSharpCompletionItemDto>();

        return new CSharpCompletionResponse(items);
    }

    public async Task<CSharpHoverResponse?> GetHoverAsync(string source, int position)
    {
        var normalizedPosition = NormalizePosition(source, position);
        var document = CreateDocument(source);
        var root = await document.GetSyntaxRootAsync();
        var semanticModel = await document.GetSemanticModelAsync();

        if (root is null || semanticModel is null || root.FullSpan.Length == 0)
        {
            return null;
        }

        var token = root.FindToken(normalizedPosition);
        var node = token.Parent;
        if (node is null)
        {
            return null;
        }

        var symbol = semanticModel.GetSymbolInfo(node).Symbol ?? semanticModel.GetDeclaredSymbol(node);
        var contents = symbol is not null
            ? $"{symbol.Kind}: {symbol.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat)}"
            : $"{node.Kind()}: {token.Text}";

        return new CSharpHoverResponse(contents, token.SpanStart, token.Span.End);
    }

    private static Document CreateDocument(string source)
    {
        var workspace = new AdhocWorkspace(HostServices);
        var projectInfo = ProjectInfo.Create(
                ProjectId.CreateNewId(),
                VersionStamp.Create(),
                "CSVisualTest",
                "CSVisualTest",
                LanguageNames.CSharp)
            .WithParseOptions(ParseOptions)
            .WithCompilationOptions(CompilationOptions)
            .WithMetadataReferences(MetadataReferences);

        var project = workspace.AddProject(projectInfo);
        return workspace.AddDocument(project.Id, "Program.cs", SourceText.From(source ?? string.Empty));
    }

    private static CSharpDiagnosticMarkerDto ToMarker(Diagnostic diagnostic, SyntaxTree syntaxTree)
    {
        var lineSpan = syntaxTree.GetLineSpan(diagnostic.Location.SourceSpan);

        return new CSharpDiagnosticMarkerDto(
            diagnostic.Id,
            diagnostic.GetMessage(),
            diagnostic.Severity.ToString(),
            lineSpan.StartLinePosition.Line + 1,
            lineSpan.StartLinePosition.Character + 1,
            lineSpan.EndLinePosition.Line + 1,
            lineSpan.EndLinePosition.Character + 1);
    }

    private static int NormalizePosition(string source, int position)
    {
        return Math.Clamp(position, 0, source?.Length ?? 0);
    }

    private static MetadataReference[] GetTrustedPlatformReferences()
    {
        var trustedPlatformAssemblies = (string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES");
        if (string.IsNullOrWhiteSpace(trustedPlatformAssemblies))
        {
            return Array.Empty<MetadataReference>();
        }

        return trustedPlatformAssemblies
            .Split(Path.PathSeparator)
            .Where(path => path.EndsWith(".dll", StringComparison.OrdinalIgnoreCase))
            .Select(path => MetadataReference.CreateFromFile(path))
            .ToArray();
    }
}
