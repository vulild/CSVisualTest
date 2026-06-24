/*
 * 功能名称：C# 教学调试会话服务
 * 开发者：Cursor Agent
 * 开发时间：2026-06-24
 */
using CsVisualTest.Roslyn.Models;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace CsVisualTest.Roslyn.Services;

public sealed class CSharpDebugService
{
    private readonly ConcurrentDictionary<string, DebugSessionState> _sessions = new();

    public DebugSessionDto Start(string source, IReadOnlyList<int> breakpoints)
    {
        var session = new DebugSessionState(
            Guid.NewGuid().ToString("N"),
            ParseExecutableLines(source ?? string.Empty),
            breakpoints.ToHashSet(),
            0,
            "Paused",
            new Dictionary<string, VariableValue>(StringComparer.Ordinal),
            new List<IdeOutputLineDto>());

        if (session.Statements.Count == 0)
        {
            session.State = "Completed";
        }

        _sessions[session.SessionId] = session;
        return ToDto(session, hitBreakpoint: session.CurrentStatement is not null && session.Breakpoints.Contains(session.CurrentStatement.Line));
    }

    public DebugSessionDto Step(string sessionId)
    {
        var session = GetSession(sessionId);
        if (session.State == "Completed")
        {
            return ToDto(session, hitBreakpoint: false);
        }

        ExecuteCurrentStatement(session);
        Advance(session);
        return ToDto(session, hitBreakpoint: false);
    }

    public DebugSessionDto Continue(string sessionId)
    {
        var session = GetSession(sessionId);
        if (session.State == "Completed")
        {
            return ToDto(session, hitBreakpoint: false);
        }

        var firstIteration = true;
        while (session.State != "Completed")
        {
            if (!firstIteration && session.CurrentStatement is not null && session.Breakpoints.Contains(session.CurrentStatement.Line))
            {
                return ToDto(session, hitBreakpoint: true);
            }

            ExecuteCurrentStatement(session);
            Advance(session);
            firstIteration = false;
        }

        return ToDto(session, hitBreakpoint: false);
    }

    public DebugSessionDto Stop(string sessionId)
    {
        var session = GetSession(sessionId);
        session.State = "Stopped";
        _sessions.TryRemove(sessionId, out _);
        return ToDto(session, hitBreakpoint: false);
    }

    private DebugSessionState GetSession(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            return session;
        }

        throw new InvalidOperationException("调试会话不存在或已结束。");
    }

    private static IReadOnlyList<DebugStatement> ParseExecutableLines(string source)
    {
        return source.Split('\n')
            .Select((line, index) => new DebugStatement(index + 1, line.Trim()))
            .Where(statement => IsExecutable(statement.Text))
            .ToArray();
    }

    private static bool IsExecutable(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        if (text is "{" or "}" or "};" || text.StartsWith("//", StringComparison.Ordinal))
        {
            return false;
        }

        return !Regex.IsMatch(text, @"^(using|namespace|public|private|protected|internal|class)\b") || text.Contains('=');
    }

    private static void ExecuteCurrentStatement(DebugSessionState session)
    {
        var statement = session.CurrentStatement;
        if (statement is null)
        {
            session.State = "Completed";
            return;
        }

        ExecuteStatement(statement.Text, session);
    }

    private static void ExecuteStatement(string statement, DebugSessionState session)
    {
        var normalized = statement.Trim().TrimEnd(';');
        var variableMatch = Regex.Match(normalized, @"^(?:var|string|int|double|bool)\s+([A-Za-z_]\w*)\s*=\s*(.+)$");
        if (variableMatch.Success)
        {
            var value = Evaluate(variableMatch.Groups[2].Value, session.Variables);
            session.Variables[variableMatch.Groups[1].Value] = value;
            return;
        }

        var assignmentMatch = Regex.Match(normalized, @"^([A-Za-z_]\w*)\s*=\s*(.+)$");
        if (assignmentMatch.Success)
        {
            session.Variables[assignmentMatch.Groups[1].Value] = Evaluate(assignmentMatch.Groups[2].Value, session.Variables);
            return;
        }

        var writeLineMatch = Regex.Match(normalized, @"^Console\.WriteLine\((.*)\)$");
        if (writeLineMatch.Success)
        {
            var value = Evaluate(writeLineMatch.Groups[1].Value, session.Variables);
            session.Output.Add(new IdeOutputLineDto("stdout", value.Value));
        }
    }

    private static VariableValue Evaluate(string expression, IReadOnlyDictionary<string, VariableValue> variables)
    {
        var parts = expression.Split('+', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length > 1)
        {
            var concatenatedValue = string.Concat(parts.Select(part => Evaluate(part, variables).Value));
            return new VariableValue("string", concatenatedValue);
        }

        var trimmed = expression.Trim();
        if (trimmed.StartsWith('"') && trimmed.EndsWith('"') && trimmed.Length >= 2)
        {
            return new VariableValue("string", trimmed[1..^1]);
        }

        if (int.TryParse(trimmed, out var intValue))
        {
            return new VariableValue("int", intValue.ToString());
        }

        if (double.TryParse(trimmed, out var doubleValue))
        {
            return new VariableValue("double", doubleValue.ToString());
        }

        if (bool.TryParse(trimmed, out var boolValue))
        {
            return new VariableValue("bool", boolValue.ToString().ToLowerInvariant());
        }

        return variables.TryGetValue(trimmed, out var value)
            ? value
            : new VariableValue("unknown", trimmed);
    }

    private static void Advance(DebugSessionState session)
    {
        session.CurrentIndex += 1;
        if (session.CurrentIndex >= session.Statements.Count)
        {
            session.State = "Completed";
        }
    }

    private static DebugSessionDto ToDto(DebugSessionState session, bool hitBreakpoint)
    {
        return new DebugSessionDto(
            session.SessionId,
            session.State,
            session.CurrentStatement?.Line,
            hitBreakpoint,
            session.Variables.Select(variable => new VariableDto(variable.Key, variable.Value.Type, variable.Value.Value)).ToArray(),
            session.Output.ToArray());
    }

    private sealed record DebugStatement(int Line, string Text);

    private sealed record VariableValue(string Type, string Value);

    private sealed class DebugSessionState(
        string sessionId,
        IReadOnlyList<DebugStatement> statements,
        ISet<int> breakpoints,
        int currentIndex,
        string state,
        Dictionary<string, VariableValue> variables,
        List<IdeOutputLineDto> output)
    {
        public string SessionId { get; } = sessionId;
        public IReadOnlyList<DebugStatement> Statements { get; } = statements;
        public ISet<int> Breakpoints { get; } = breakpoints;
        public Dictionary<string, VariableValue> Variables { get; } = variables;
        public List<IdeOutputLineDto> Output { get; } = output;
        public DebugStatement? CurrentStatement => CurrentIndex >= 0 && CurrentIndex < Statements.Count ? Statements[CurrentIndex] : null;
        public int CurrentIndex { get; set; } = currentIndex;
        public string State { get; set; } = state;
    }
}
