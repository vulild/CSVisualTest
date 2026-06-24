/*
 * 功能名称：C# 代码启动运行服务
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Diagnostics;

namespace CsVisualTest.Roslyn.Services;

public sealed class CSharpRunService
{
    private static readonly CSharpParseOptions ParseOptions = CSharpParseOptions.Default
        .WithLanguageVersion(LanguageVersion.Preview);

    private static readonly CSharpCompilationOptions CompilationOptions = new(OutputKind.ConsoleApplication);

    private static readonly MetadataReference[] MetadataReferences = GetTrustedPlatformReferences();

    public async Task<CSharpRunResponse> RunAsync(string source, CancellationToken cancellationToken = default)
    {
        var workspacePath = Path.Combine(Path.GetTempPath(), "csvisualtest", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(workspacePath);

        try
        {
            var assemblyPath = Path.Combine(workspacePath, "UserProgram.dll");
            var syntaxTree = CSharpSyntaxTree.ParseText(source ?? string.Empty, ParseOptions);
            var compilation = CSharpCompilation.Create(
                "UserProgram",
                new[] { syntaxTree },
                MetadataReferences,
                CompilationOptions);

            using var assemblyStream = File.Create(assemblyPath);
            var emitResult = compilation.Emit(assemblyStream, cancellationToken: cancellationToken);
            var diagnostics = emitResult.Diagnostics
                .Where(diagnostic => diagnostic.Severity is DiagnosticSeverity.Error or DiagnosticSeverity.Warning)
                .Select(diagnostic => ToMarker(diagnostic, syntaxTree))
                .ToArray();
            assemblyStream.Close();

            if (!emitResult.Success)
            {
                return new CSharpRunResponse(false, -1, diagnostics.Select(ToOutputLine).ToArray(), diagnostics);
            }

            var runtimeConfigPath = Path.Combine(workspacePath, "UserProgram.runtimeconfig.json");
            await File.WriteAllTextAsync(runtimeConfigPath, """
                {
                  "runtimeOptions": {
                    "tfm": "net8.0",
                    "framework": {
                      "name": "Microsoft.NETCore.App",
                      "version": "8.0.0"
                    }
                  }
                }
                """, cancellationToken);

            var output = await RunProcessAsync(assemblyPath, workspacePath, cancellationToken);
            return new CSharpRunResponse(output.ExitCode == 0, output.ExitCode, output.Lines, diagnostics);
        }
        finally
        {
            TryDeleteDirectory(workspacePath);
        }
    }

    private static async Task<(int ExitCode, IReadOnlyList<IdeOutputLineDto> Lines)> RunProcessAsync(
        string assemblyPath,
        string workingDirectory,
        CancellationToken cancellationToken)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "dotnet",
                ArgumentList = { assemblyPath },
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            },
            EnableRaisingEvents = true,
        };

        var output = new List<IdeOutputLineDto>();
        process.OutputDataReceived += (_, args) =>
        {
            if (args.Data is not null)
            {
                output.Add(new IdeOutputLineDto("stdout", args.Data));
            }
        };
        process.ErrorDataReceived += (_, args) =>
        {
            if (args.Data is not null)
            {
                output.Add(new IdeOutputLineDto("stderr", args.Data));
            }
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeout.Token);
        try
        {
            await process.WaitForExitAsync(linked.Token);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }

            output.Add(new IdeOutputLineDto("stderr", "程序运行超时，已停止。"));
        }

        return (process.HasExited ? process.ExitCode : -1, output);
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

    private static IdeOutputLineDto ToOutputLine(CSharpDiagnosticMarkerDto diagnostic)
    {
        return new IdeOutputLineDto("stderr", $"{diagnostic.Id}: {diagnostic.Message}");
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

    private static void TryDeleteDirectory(string path)
    {
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, recursive: true);
            }
        }
        catch
        {
            // 临时运行目录删除失败不影响 IDE 运行结果。
        }
    }
}
