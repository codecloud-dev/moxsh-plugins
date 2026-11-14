# 更新日志 · moxsh-plugins

> 格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

本文件记录**显著的**用户可见变更。琐碎的排版、内部重构、CI 微调不单独列条目；完整逐笔记录请看 [提交历史](../../commits/main) 与 [Releases](../../releases)。

## [1.0.2] - 2026-11-14

### 变更 / 目录更新

- **仓库版本 1.0.1 → 1.0.2**，`catalog.json` / `plugins.json` 的 `repoVersion` 与 `updated` 日期同步更新；README.md 与 README.en.md 的版本徽章及「仓库版本」说明对齐为 1.0.2。
- **文档补全**：README.en.md 此前落后于中文版，本次补齐 `schema/entry-schema.json`、`scripts/check-schemas.mjs` 的目录结构说明、本地校验清单（含零依赖自测命令与 integrity/signature 规则校验说明），以及 1.0.1 的路线图条目（完整性/签名字段对齐 suite spec、`.mox` manifest 必填约束、Schema 自测 + CI）。
- **文档修正**：CONTRIBUTING.md「本地验证」表补上 CI 实际运行的 `node scripts/check-schemas.mjs` 命令条目，并标注 `entry-schema.json` 的字段约束。
- 说明：目录内两个第一方示例插件（`hello-mox`、`glass-terminal-theme`）版本号维持 1.0.1，二者均为本仓内置 demo、无外部可查版本源，版本与文件内一致，未做无依据修改。

## [Unreleased]

> 尚未发布的改动合并后写在这里，发布时归入对应版本段落。

### 新增 / 修复 / 变更

- _（暂无待发布条目）_

## 历史版本

历史变更请看 [Releases 页面](../../releases)；本文件自 2026-11-11 起统一维护，此前条目不再补录，避免与发布记录产生两个互相矛盾的版本来源。

---

**条目写法**：`### 新增` / `### 修复` / `### 变更` / `### 移除` / `### 安全`，每条一句话说清「用户能感知到什么变化」，涉及破坏性变更必须以 **`BREAKING`** 开头标出。
