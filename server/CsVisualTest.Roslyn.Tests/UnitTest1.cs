/*
 * 功能名称：Roslyn C# 全语法解析服务单元测试
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Services;
using RoslynSyntaxNodeDto = CsVisualTest.Roslyn.Models.RoslynSyntaxNodeDto;

namespace CsVisualTest.Roslyn.Tests;

public class RoslynParserTests
{
    [Fact]
    public void Parse_SupportsModernCSharpSyntaxTree()
    {
        var parser = new RoslynParser();
        var source = """
            using System;

            var message = new Person("Ada") switch
            {
                { Name: "Ada" } => "compiler",
                _ => "unknown"
            };
            Console.WriteLine(message);

            public record Person(string Name);
            """;

        var result = parser.Parse(source);

        Assert.False(result.HasErrors);
        Assert.Contains("RecordDeclaration", FlattenKinds(result.Root));
        Assert.Contains("SwitchExpression", FlattenKinds(result.Root));
        Assert.Contains("GlobalStatement", FlattenKinds(result.Root));
    }

    [Fact]
    public void Parse_ReturnsLineAndColumnDiagnostics()
    {
        var parser = new RoslynParser();
        var result = parser.Parse("class Broken { void Run( { }");

        Assert.True(result.HasErrors);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Line >= 1 && diagnostic.Column >= 1);
    }

    [Fact]
    public void GetDiagnostics_ReturnsMonacoFriendlyMarkers()
    {
        var service = new CSharpLanguageService();
        var diagnostics = service.GetDiagnostics("class Broken { void Run( { }");

        Assert.Contains(diagnostics, diagnostic => diagnostic.StartLineNumber >= 1 && diagnostic.StartColumn >= 1);
    }

    [Fact]
    public async Task GetCompletionsAsync_ReturnsCSharpItems()
    {
        var service = new CSharpLanguageService();
        var source = """
            using System;

            public class Demo
            {
                public void Run()
                {
                    Console.
                }
            }
            """;
        var response = await service.GetCompletionsAsync(source, source.IndexOf("Console.", StringComparison.Ordinal) + "Console.".Length);

        Assert.Contains(response.Items, item => item.Label == "WriteLine");
    }

    [Fact]
    public async Task GetHoverAsync_ReturnsSymbolInformation()
    {
        var service = new CSharpLanguageService();
        var source = """
            public class Demo
            {
                public int Count { get; set; }
            }
            """;
        var hover = await service.GetHoverAsync(source, source.IndexOf("Count", StringComparison.Ordinal));

        Assert.NotNull(hover);
        Assert.Contains("Count", hover!.Contents);
    }

    private static IEnumerable<string> FlattenKinds(RoslynSyntaxNodeDto node)
    {
        yield return node.Kind;

        foreach (var child in node.Children.SelectMany(FlattenKinds))
        {
            yield return child;
        }
    }
}