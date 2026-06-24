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

    private static IEnumerable<string> FlattenKinds(RoslynSyntaxNodeDto node)
    {
        yield return node.Kind;

        foreach (var child in node.Children.SelectMany(FlattenKinds))
        {
            yield return child;
        }
    }
}