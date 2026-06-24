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

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapPost("/api/parse", (RoslynParseRequest request, RoslynParser parser) =>
{
    var response = parser.Parse(request.Source);
    return Results.Ok(response);
});

app.Run();
