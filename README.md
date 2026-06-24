# CSVisualTest

一个 C# 方块式 IDE 原型，支持在文本代码和 Scratch 风格可视化方块之间实时同步。

## 功能

- C# 代码编辑：左侧文本编辑器可直接修改 C# 代码。
- C# 子集解析：支持 `using`、`namespace`、`class`、`method`、变量声明、赋值、方法调用、`if`、`return` 和注释。
- 方块式编程：右侧以嵌套方块展示语法结构，并可编辑字段、添加语句或删除语句。
- 双向实时同步：修改代码会刷新方块；修改方块会重新生成 C# 代码。

## 架构

```text
src/
  core/ast/          统一 C# AST 模型
  core/parser/       C# 文本 -> AST
  core/serializer/   AST -> C# 文本
  blocks/            AST 与可视化方块的互转、方块 UI
  editor/            C# 文本编辑器
  sync/              代码/方块双向同步引擎
```

## 开发命令

```bash
npm install
npm run dev
npm run test
npm run build
```
