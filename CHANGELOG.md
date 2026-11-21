# 更新日志 · moxsh-plugins

> 格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

本文件记录**显著的**用户可见变更。琐碎的排版、内部重构、CI 微调不单独列条目；完整逐笔记录请看 [提交历史](../../commits/main) 与 [Releases](../../releases)。

## [1.0.5] - 2026-11-21

### 修复

- **两份索引漂移可被守门抓到**：`check-schemas.mjs` 现在逐 id 比对 `catalog.json` 与 `plugins.json` 的 `updated`/`repoVersion`，避免目录数据改了一边忘改另一边。
- **校验器负向探针补上「updated 漂移 / 非法日期」两类真实回滚路径**，防止 schema 约束被弱化后 CI 仍然假绿。
## [1.0.4] - 2026-11-19

> 目录数据此前已标到 `1.0.3` 但 CHANGELOG 未留段，本次不倒填无依据内容；按当前目录真实版本 `1.0.4` 发版并补齐变更记录。仓库版本、`catalog.json` / `plugins.json` 的 `repoVersion`、`updated` 与 README 中英徽章全部对齐。

### 修复

- **Schema 的 semver 约束可被绕过**：`entry-schema.json` 旧内联正则结尾无 `$`，`1.0.1garbage`、`1.0.1;rm -rf /` 都能通过；`catalog.schema.json` 的 `entry.version` 干脆没有 semver 约束。现两份 schema 统一 `$ref` 到同一 `#/$defs/semver` 完整锚定定义，校验器新增负向探针直接拿 schema 里的真实 pattern 反证严格性，防一侧收紧一侧漂移。
- **三方一致性存在假绿**：旧 `check-schemas.mjs` 只比 `minVersion` / `revokedVersions`；把包内 `plugin.json` 的 `id` 改成 `spoofed-id`、`version` 改成 `9.9.9`、`type` 改成 `rootfs`，仍是 58/0 全过。现逐 id 核对 id / version / type，并检测重复 id / 重复 path、当前版本落在自身撤销名单、两份索引重复条目。
- **插件包类型缺失**：`hello-mox` / `glass-terminal-theme` 的 `plugin.json` 补 `type` 字段，与目录项一致。
- **Gitee 镜像说明过时**：README 中英从「每小时同步」改为与现有 workflow 一致的「main 每次推送触发 + 6 小时兜底」。

### 新增

- `scripts/check-validators.mjs`：零依赖负向回归，真注入 12 类篡改（冒名 id / 版本漂移 / 类型漂移 / 文件缺失 / 自我撤销 / 重复 id / 弱 semver / schema 退化等），断言校验器必须拒绝，避免「校验器自己没被校验」。
- `scripts/bench-check.mjs`：生成 N 条自洽合成 catalog，在临时目录真跑校验器三轮取中位数；基准不设性能阈值，只输出真实机器数字。本机 N=200 实测：中位 **31.2 ms**、约 **6413 entries/s**（随负载波动）。

### 验证

- `node scripts/check-schemas.mjs` EXIT=0：**87 通过 / 0 失败**。
- `node scripts/check-plugin-policy.mjs` EXIT=0：**36 通过 / 0 失败**。
- `node scripts/check-validators.mjs` EXIT=0：**12 负向用例全部按预期拒绝**。
- `node scripts/bench-check.mjs 200` EXIT=0：`validatorExit=0`，中位 31.2 ms / 6413 entries/s。

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
