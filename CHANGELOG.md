# 变更记录

| 日期 | 变更原因 | 变更人 | 变更点 | 代码位置 |
| --- | --- | --- | --- | --- |
| 2026-06-24 | 创建 C# 方块式 IDE 原型，支持 C# 语法解析、Scratch 风格可视化方块，以及代码/方块双向实时同步 | Cursor Agent | 新增 Vite + React + TypeScript 工程；新增 C# AST、解析器、序列化器、方块模型、同步引擎、编辑器 UI、单元测试与项目说明 | `package.json`, `index.html`, `vite.config.ts`, `src/`, `README.md` |
| 2026-06-24 | 修复验证阶段发现的测试断言与类型配置问题，确保单元测试和生产构建通过 | Cursor Agent | 调整 UI/同步测试断言；将 Vite 配置切换为 Vitest 配置类型；新增 Vite 客户端类型声明 | `src/App.test.tsx`, `src/sync/SyncEngine.test.ts`, `vite.config.ts`, `src/vite-env.d.ts` |
