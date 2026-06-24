# CSVisualTest

一个 C# 方块式 IDE 原型，支持在文本代码、Scratch 风格可视化方块和 Roslyn 全语法树之间实时同步。

## 功能

- C# 代码编辑：左侧使用 Monaco Editor，可直接修改 C# 代码。
- Roslyn 全语法解析：后端通过 `Microsoft.CodeAnalysis.CSharp` 解析任意 C# 语法树并返回诊断。
- C# LSP 风格能力：Monaco 对接 Roslyn 诊断、补全和悬停接口。
- 启动运行：后端编译 C# 控制台程序并捕获 stdout/stderr。
- 调试体验：支持断点、继续、单步、当前行高亮和变量监控。
- 输出面板：展示编译、运行、调试和程序输出。
- 方块式编程：右侧以嵌套方块展示语法结构，并可编辑字段、添加语句、删除语句或拖拽排序。
- 常用语法工具箱：支持拖拽变量、赋值、调用、`if`、`return`、注释，以及 for/while/foreach/switch/try 等 Roslyn 原始语法模板。
- 双向实时同步：修改代码会刷新方块；修改方块会重新生成 C# 代码。

## 架构

```text
src/
  core/ast/          统一 C# AST 模型
  core/parser/       本地 C# 方块 AST 解析 + Roslyn API 客户端
  core/serializer/   AST -> C# 文本
  blocks/            AST 与可视化方块的互转、工具箱、Roslyn 语法树面板
  editor/            Monaco C# 编辑器与 Roslyn LSP 客户端
  debug/             启动、调试、输出、变量监控前端模块
  sync/              代码/方块双向同步引擎

server/
  CsVisualTest.Roslyn/        Roslyn C# 语法解析 API + LSP 风格语言服务 + 运行调试服务
  CsVisualTest.Roslyn.Tests/  Roslyn 服务单元测试
```

## 开发命令

```bash
npm install
npm run dev
npm run dev:api
npm run test
npm run build
npm run test:api
npm run build:api
```
