# Claude Code Best 实战手册

面向**源码贡献者**与**二次开发者**的实操指南：从环境搭建、日常开发、API 配置、断点调试，到改代码时该看哪些文件。功能特性的详细说明见 `[docs/features/](features/)` 与 [在线文档](https://ccb.agent-aura.top/)。

---

## 目录

1. [5 分钟跑通](#1-5-分钟跑通)
2. [日常开发工作流](#2-日常开发工作流)
3. [模型与 API 配置](#3-模型与-api-配置)
4. [断点调试 query.ts](#4-断点调试-queryts)
5. [构建与质量检查](#5-构建与质量检查)
6. [代码地图：改哪里](#6-代码地图改哪里)
7. [Feature Flag 速查](#7-feature-flag-速查)
8. [常见实战场景](#8-常见实战场景)
9. [测试要点](#9-测试要点)
10. [提交与协作](#10-提交与协作)
11. [故障排查](#11-故障排查)
12. [附录：命令速查](#附录命令速查)
13. [附录：文档索引](#附录文档索引)

---

## 1. 5 分钟跑通

### 环境要求


| 项目   | 要求                                     |
| ---- | -------------------------------------- |
| 运行时  | **Bun ≥ 1.3.11**（建议 `bun upgrade` 到最新） |
| 操作系统 | Windows / macOS / Linux                |
| 工作目录 | 仓库根目录（含 `package.json`）                |


```bash
# 安装 Bun（Windows PowerShell）
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证
bun --version
bun --help
```

### 克隆与安装

```bash
git clone https://github.com/claude-code-best/claude-code.git
cd claude-code
bun install
```

### 启动 REPL

```bash
bun run dev
```

看到 **Claude Code** 版本号与 REPL 提示符即成功。开发模式默认启用全部 Feature（见 `scripts/dev.ts` / `scripts/devArgs.ts`）。

### 管道模式（无 TUI，适合脚本验证）

```bash
echo "say hello" | bun run dev -p
echo "Reply with exactly: OK" | bun run dev -p --model <模型名>
```

### 首次 API 配置

在 REPL 输入 `/login`，选择 **Anthropic Compatible**（或 OpenAI / Gemini 等），填写 Base URL、API Key、模型 ID。

配置持久化路径：


| 平台            | 路径                                    |
| ------------- | ------------------------------------- |
| Windows       | `%USERPROFILE%\.claude\settings.json` |
| macOS / Linux | `~/.claude/settings.json`             |


也可直接编辑 `settings.json` 的 `env` 字段注入环境变量（见 [§3](#3-模型与-api-配置)）。

---

## 2. 日常开发工作流

### 命令对照


| 目的             | 命令                                          |
| -------------- | ------------------------------------------- |
| 终端开发（子进程）      | `bun run dev`                               |
| 带 inspect 同进程  | `bun run dev:inspect`                       |
| F5 调试验证路径      | `bun run verify:f5`                         |
| 重新生成 launch 配置 | `bun run generate:launch`                   |
| 改完代码全量检查       | `bun run precheck`                          |
| 仅类型检查          | `bun run typecheck`                         |
| 单文件测试          | `bun test src/utils/__tests__/hash.test.ts` |


### 进程模型（必读）

```
bun run dev
  └─ scripts/dev.ts
       └─ Bun.spawnSync → src/entrypoints/cli.tsx   ← 子进程，F5 断点打不中

F5 / dev:inspect
  └─ scripts/dev-cli.ts
       └─ import cli.tsx                             ← 同进程，可断点
```

**结论：** 日常迭代用 `bun run dev`；调试 `query.ts` 等核心逻辑用 F5 attach（见 [§4](#4-断点调试-queryts)）。

### 改代码后的标准流程

```bash
# 1. 改代码
# 2. 相关测试
bun test path/to/__tests__/xxx.test.ts

# 3. 提交前全量检查（typecheck + lint fix + 全量测试）
bun run precheck
```

### 项目内 REPL 常用命令


| 命令               | 说明                   |
| ---------------- | -------------------- |
| `/login`         | 配置 API 提供商           |
| `/poor`          | 穷鬼模式（省 token，关记忆提取等） |
| `/model`         | 切换模型                 |
| `/doctor`        | 环境诊断                 |
| `/teach-me <主题>` | 交互式学习项目模块            |


---

## 3. 模型与 API 配置

### 3.1 Anthropic 兼容（DeepSeek、OpenRouter 代理等）

`~/.claude/settings.json` 示例（DeepSeek Anthropic 兼容端点）：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_API_KEY": "sk-xxx",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash"
  }
}
```

验证：

```bash
echo "Reply with exactly: API_OK" | bun run dev -p --model deepseek-v4-flash
```

### 3.2 多 Provider 环境变量


| Provider                   | 启用变量                       | 关键配置                                                |
| -------------------------- | -------------------------- | --------------------------------------------------- |
| Anthropic 直连               | （默认）                       | `ANTHROPIC_API_KEY`                                 |
| OpenAI 兼容                  | `CLAUDE_CODE_USE_OPENAI=1` | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` |
| Gemini                     | `CLAUDE_CODE_USE_GEMINI=1` | `GEMINI_API_KEY`, `GEMINI_MODEL`                    |
| Grok                       | `CLAUDE_CODE_USE_GROK=1`   | Grok 相关 env                                         |
| Bedrock / Vertex / Foundry | 各自 `CLAUDE_CODE_USE_*=1`   | 见 `src/utils/model/providers.ts`                    |


Provider 优先级：**参数 modelType > 环境变量 > 默认 firstParty**。

### 3.3 REPL 内 `/login`

适合不熟悉 env 名的用户；与 `settings.json` 写入的配置等价。Tab / Shift+Tab 切换字段，Enter 保存。

---

## 4. 断点调试 query.ts

完整说明：[docs/vscode-f5-debugging.md](vscode-f5-debugging.md)

### 最短路径

1. 安装扩展 **Bun for Visual Studio Code**（`oven.bun-vscode`）
2. **Developer: Reload Window**
3. F5 → **「Smoke: debugger 是否工作」**（验证调试器）
4. F5 → **「★ Attach REPL → query.ts (首选)」**
5. attach 后在 `dev-cli.ts` 入口暂停 → **F5 继续**
6. REPL Terminal 输入 `hello` → 断点命中 `src/query.ts`

### Windows 注意

- preLaunchTask 使用 `type: process`，避免 PowerShell `-Command` 解析错误
- 优先 **attach + `--inspect-brk`**，不要用 Node 调试器跑 `bun run dev`
- 端口 6499 占用：`Get-Process bun | Stop-Process -Force`

---

## 5. 构建与质量检查

### 构建

```bash
bun run build          # Bun.build 代码分割 → dist/cli.js + chunks
bun run build:vite     # Vite 备选管线
```

产物在 `dist/`，Bun 与 Node 均可运行（`build.ts` 会做 `import.meta.require` 后处理）。

### 质量门禁

```bash
bun run precheck       # typecheck + biome check:fix + bun test（提交前必过）
bun run lint           # 仅 lint
bun run check:fix      # lint + format 自动修复
bun run health         # 健康检查脚本
```

**规范：** 生产代码禁止 `as any`；`feature()` 只能直接用在 `if` 或三元条件里（Bun 编译器限制）。

---

## 6. 代码地图：改哪里

### 启动链

```
src/entrypoints/cli.tsx     # 真入口，快速路径分发
src/main.tsx                # Commander 子命令注册
src/entrypoints/init.ts     # 一次性初始化
```

### 核心对话循环

```
src/screens/REPL.tsx        # Ink TUI、用户输入
src/QueryEngine.ts          # 会话编排、压缩、快照
src/query.ts                # API 请求主循环、工具调用回合
src/services/api/claude.ts  # Anthropic SDK 流式请求
```

### 工具系统

```
src/tools.ts                          # 工具注册表
packages/builtin-tools/src/tools/     # 60+ 内置工具实现
src/Tool.ts                           # Tool 接口
src/constants/tools.ts                # CORE_TOOLS 白名单
```

### UI（Ink）

```
packages/@ant/ink/          # Fork 版 Ink 框架
src/components/             # REPL 组件（Messages、PromptInput、permissions…）
src/ink.ts                  # 渲染包装 + ThemeProvider
```

### 状态与配置

```
src/state/AppState.tsx      # 中央状态
src/bootstrap/state.ts      # 会话级单例
~/.claude/settings.json     # 用户配置
scripts/defines.ts          # 版本号与 MACRO 定义
```

### Feature Flag

```ts
import { feature } from 'bun:bundle'
if (feature('BUDDY')) { /* ... */ }
```

运行时：`FEATURE_BUDDY=1 bun run dev`。Dev/build 各有默认启用列表（见 `scripts/defines.ts` 的 `DEFAULT_BUILD_FEATURES`）。

---

## 7. Feature Flag 速查

```bash
# 启用单个
FEATURE_DAEMON=1 bun run dev

# 启用多个
FEATURE_BUDDY=1 FEATURE_ACP=1 bun run dev
```


| 类别    | 示例 Flag                                                        |
| ----- | -------------------------------------------------------------- |
| 基础    | `BUDDY`, `BRIDGE_MODE`, `VOICE_MODE`, `ACP`                    |
| Agent | `AGENT_TRIGGERS`, `ULTRATHINK`, `VERIFICATION_AGENT`           |
| 工作流   | `WORKFLOW_SCRIPTS`, `KAIROS`, `COORDINATOR_MODE`               |
| 实验    | `EXPERIMENTAL_SKILL_SEARCH`, `EXPERIMENTAL_SEARCH_EXTRA_TOOLS` |


完整列表与功能说明：[docs/features/all-features-guide.md](features/all-features-guide.md)

---

## 8. 常见实战场景

### 8.1 改 API 请求 / 流式逻辑

1. 读 `src/query.ts` 中 `queryLoop`、`deps.callModel`
2. 读 `src/services/api/claude.ts`
3. 用 F5 attach 在 `query.ts` 打断点验证
4. 管道快速回归：`echo "test" | bun run dev -p`

### 8.2 新增或修改内置工具

1. 在 `packages/builtin-tools/src/tools/<ToolName>/` 实现
2. 在包入口导出，确认 `src/tools.ts` 注册
3. 若属延迟工具，检查 `src/constants/tools.ts` 的 `CORE_TOOLS`
4. 添加 `__tests__/` 单元测试

### 8.3 改 REPL 界面或快捷键

1. `src/screens/REPL.tsx` — 主屏幕
2. `src/components/PromptInput/` — 输入框
3. `packages/@ant/ink/` — 底层组件与 keybindings

### 8.4 对接新的 OpenAI 兼容端点

1. 设置 `CLAUDE_CODE_USE_OPENAI=1` 及相关 env
2. 逻辑在 `src/services/api/openai/`
3. `/login` 选择 OpenAI 兼容亦可

### 8.5 自托管 Remote Control

```bash
bun run rcs    # 启动 Remote Control Server + Web UI
```

详见 [docs/features/remote-control-self-hosting.md](features/remote-control-self-hosting.md)

### 8.6 ACP 接入 Cursor / Zed

```bash
# 示例：acp-link 桥接
# 见 docs/features/acp-link.md、docs/features/acp-zed.md
```

---

## 9. 测试要点

- 框架：**bun:test**，测试文件 `src/**/__tests__/*.test.ts`
- 集成测试：`tests/integration/`
- **只 mock 有副作用的链**（`log.ts`、`debug.ts`、`bun:bundle`、网络库等）
- 共享 mock：`tests/mocks/log.ts`、`tests/mocks/debug.ts`
- `**mock.module` 是进程全局的** — 同目录 `launch*.test.ts` 应 mock axios 而非业务 API 模块

```bash
bun test                              # 全量
bun test src/path/to/foo.test.ts      # 单文件
bun test --coverage                   # 覆盖率
```

---

## 10. 提交与协作

### Commit 规范（Conventional Commits）

```
feat: 添加 xxx
fix: 修复 xxx
docs: 更新 xxx
chore: 维护性变更
refactor: 重构 xxx
```

### 提交前

```bash
bun run precheck
```

Pre-commit 会跑 lint-staged（Biome）。Windows 需保证 `node` / `npx` 在 PATH 中。

### 文档贡献

- 功能文档：`docs/features/`
- 在线站：`bun run docs:dev`（Mintlify）
- 本手册与调试说明：`docs/practical-handbook.md`、`docs/vscode-f5-debugging.md`

---

## 11. 故障排查


| 现象                          | 处理                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `bun: command not found`    | 重启终端；确认 `~/.bun/bin` 在 PATH；Windows 可用绝对路径 `%USERPROFILE%\.bun\bin\bun.exe`        |
| `bun run dev` 版本不对          | 确认在仓库根目录；`bun upgrade`                                                             |
| API 401 / 连接失败              | 检查 `~/.claude/settings.json`；`/doctor`；管道 `-p` 测单轮                                 |
| F5 断点不命中                    | 勿用 `bun run dev` 调试；用 attach 配置，见 [vscode-f5-debugging.md](vscode-f5-debugging.md) |
| precheck 类型错误               | `bun run typecheck` 定位；scripts 下避免直接 `globalThis.MACRO`，用类型断言                      |
| `production is not defined` | F5 配置勿用 `-d NODE_ENV`；用 `dev-cli.ts` + env                                         |
| 测试偶发失败                      | 怀疑 `mock.module` 污染；单独跑可疑文件定位                                                      |
| 构建后 RSS 过高                  | 确认 code splitting 开启（见 CLAUDE.md 架构说明）                                             |


---

## 附录：命令速查

```bash
# 开发
bun install
bun run dev
bun run dev -p
bun run dev:inspect

# 调试配置
bun run generate:launch
bun run verify:f5

# 质量
bun run precheck
bun run typecheck
bun test
bun run lint:fix

# 构建
bun run build
bun run build:vite

# 其他
bun run rcs
bun run docs:dev
bun run health
```

---

## 附录：文档索引


| 文档                                             | 内容                                     |
| ---------------------------------------------- | -------------------------------------- |
| [README.md](../README.md)                      | 项目介绍、快速开始                              |
| [CLAUDE.md](../CLAUDE.md)                      | AI Agent 工作区规范（架构、测试、Feature Flag）     |
| [本手册](practical-handbook.md)                   | 源码开发实战                                 |
| **[Harness 实战指导](harness-practical-guide.md)** | 生产级智能体 L0–L12 Harness 分层、生命周期、Playbook |
| [VS Code 断点调试](vscode-f5-debugging.md)         | F5 / attach 详细步骤                       |
| [全功能指南](features/all-features-guide.md)        | 各 Feature 用法                           |
| [在线文档](https://ccb.agent-aura.top/)            | Mintlify 站点                            |


---

**维护：** 新增常用开发流程或踩坑经验时，请同步更新本手册相应章节。