/*
 * 功能名称：Roslyn C# 语法解析 API 入口
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Models;
using CsVisualTest.Roslyn.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});
builder.Services.AddSingleton<RoslynParser>();
builder.Services.AddSingleton<CSharpLanguageService>();
builder.Services.AddSingleton<CSharpRunService>();
builder.Services.AddSingleton<CSharpDebugService>();

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapPost("/api/parse", (RoslynParseRequest request, RoslynParser parser) =>
{
    var response = parser.Parse(request.Source);
    return Results.Ok(response);
});
app.MapPost("/api/lsp/diagnostics", (CSharpDocumentRequest request, CSharpLanguageService languageService) =>
{
    return Results.Ok(languageService.GetDiagnostics(request.Source));
});
app.MapPost("/api/lsp/completions", async (CSharpPositionRequest request, CSharpLanguageService languageService) =>
{
    return Results.Ok(await languageService.GetCompletionsAsync(request.Source, request.Position));
});
app.MapPost("/api/lsp/hover", async (CSharpPositionRequest request, CSharpLanguageService languageService) =>
{
    var response = await languageService.GetHoverAsync(request.Source, request.Position);
    return response is null ? Results.NoContent() : Results.Ok(response);
});
app.MapPost("/api/run", async (CSharpRunRequest request, CSharpRunService runService, CancellationToken cancellationToken) =>
{
    return Results.Ok(await runService.RunAsync(request.Source, cancellationToken));
});
app.MapPost("/api/debug/start", (DebugStartRequest request, CSharpDebugService debugService) =>
{
    return Results.Ok(debugService.Start(request.Source, request.Breakpoints));
});
app.MapPost("/api/debug/step", (DebugActionRequest request, CSharpDebugService debugService) =>
{
    return Results.Ok(debugService.Step(request.SessionId));
});
app.MapPost("/api/debug/continue", (DebugActionRequest request, CSharpDebugService debugService) =>
{
    return Results.Ok(debugService.Continue(request.SessionId));
});
app.MapPost("/api/debug/stop", (DebugActionRequest request, CSharpDebugService debugService) =>
{
    return Results.Ok(debugService.Stop(request.SessionId));
});

app.Run();
