# 隐私政策 / Privacy Policy

**适用仓库**：`codecloud-dev/moxsh-plugins`（moxsh 插件商店的索引与清单仓库）
**生效日期 / Effective date**：2026-11-15
**责任主体**：`codecloud-dev` —— 一个 GitHub 个人账号，由个人开发者运营，**不是公司、不是法人实体**；没有公司名称、注册号、注册地址或客服电话。

> 中文在前，英文在后，同一份文件；口径一致，歧义以中文为准。
> 本政策按仓库里的 `catalog.json` / `plugins.json` / `schema/` 与 README 的**真实内容**写。这个仓库是**纯静态数据仓**，没有服务端、没有数据库、没有 Cookie、没有埋点，所以「我们收集什么」的答案基本是「不收集」；但把「为什么不收集」「谁在下载时会产生日志」「当前包体状态」写清楚，不写套话。
> 撰写口径参考 GDPR 与《个人信息保护法》的最小必要、目的限定、透明原则，不引用、不复制任何条文原文。

---

## 一、这个仓库是什么

- 它只是**一组静态 JSON 文件 + JSON Schema + 插件源码目录**：`catalog.json`（App 直接消费的索引）、`plugins.json`（社区全量索引）、`schema/catalog.schema.json` 与 `schema/entry-schema.json`（校验规则）、`plugins/`（插件目录）。
- 托管在 **GitHub**（唯一主源 `codecloud-dev/moxsh-plugins`），并有一个 **Gitee 只读镜像**（`gitee.com/codecloud-dev/moxsh-plugins`，每小时从 GitHub 同步）。
- 仓库本身**不运行代码、不接收 HTTP 请求、不写日志、不设账号、不种 Cookie、不发邮件**。

## 二、联网行为发生在谁那一侧

联网的是**使用这个仓库的 App（moxsh 终端）**，不是这个仓库：

- App 内 `CloudStoreApi` 拉取 `<base>/catalog.json`（要求顶层是对象、内含 `entries` 数组，每条必须带 `type`）；
- 按 id 下载 `<base>/pkg/<id>.mox` 包；
- 云源地址可配，失败时静默回退内置目录（见 moxsh-terminal 隐私政策）。

读取静态文件时，托管平台（GitHub / Gitee / 其 CDN）会按其自身政策记录常规访问日志（如请求 IP、时间、路径、UA）。**这些日志由平台产生、由平台控制，本仓库不读取、不接收、不存储，也无法删除**。

## 三、仓库里有哪些「数据」（都是插件元数据，不是用户数据）

`catalog.json` 的 `entries[]` 每条字段（以 `1.0.3` 版实际内容为准）：

`id`、`name`、`version`、`author`、`description`、`type`（plugin/skill/theme/rootfs）、`minAppVersion`、`permissions`、`price`、`purchased`、`sizeBytes`、`tags`、`repository`、`path`、`packageStatus`、`minVersion`、`revokedVersions`，顶层另有 `schemaVersion`、`repoVersion`、`updated`。

其中 `minVersion`（该插件允许安装的最低版本）与 `revokedVersions`（已确认有漏洞、禁止安装 / 回滚的版本号列表）是**插件版本安全策略的可信目录声明**，由使用本索引的 App 在安装时读取并据以拦截回滚（见 moxsh-terminal / moxsh-plugins 的 `TERMS.md` 专项条款）；它们同样是**插件元数据，不是用户数据**。

这些描述的是**插件本身**，不含任何访客、用户、设备或账号信息。例如当前两条：`hello-mox`（官方示例插件）与 `glass-terminal-theme`（主题）。

**如实说明当前状态**：两条 entry 的 `packageStatus` 均为 `"planned"`、`sizeBytes` 为 `0` —— 即**当前版本没有实际可下载的 `.mox` 包体**，App 点安装会提示「包源未配置」，属预期表现。README 明确「不允许填一个看起来像真的体积数字」。

`plugins.json` 的 `plugins[]` 面向社区/工具，额外含 `summary`、`repo`、`path`、`tags`，同样是插件元数据。

## 四、我们收集什么

**不收集。** 具体清单：

- 本仓库不收集：姓名、邮箱、账号、密码、token、设备标识、IP、User-Agent、位置、设备形态、语言、主题、浏览行为、下载行为、安装统计、崩溃、遥测。
- 不设置：Cookie、localStorage、sessionStorage、指纹、追踪像素、广告 SDK、统计 SDK。
- 不提供：登录、评论后台、兑换、支付、留言、文件上传（内容变更走 GitHub Pull Request）。
- 不上传：任何使用数据到 `codecloud-dev` 的自有服务器（**本仓库根本没有服务器**）。

**贡献者**：若你通过 GitHub 提交 Issue / Pull Request / Discussion，你的 GitHub 账号信息、提交内容与时间由 **GitHub** 按其条款处理；我们只在 GitHub 平台上看到这些内容，不另行建库存储。

## 五、存多久、存哪、与谁共享

| 项目 | 位置 | 说明 |
| --- | --- | --- |
| 索引 JSON、Schema、插件源码 | GitHub 仓库（及 Gitee 只读镜像） | 随 Git 提交历史**公开留存**；删除需通过仓库提交，历史提交仍可追溯 |
| 托管平台访问日志 | GitHub / Gitee / CDN | 由平台按其政策留存，本仓库不接触、不可删除 |
| 你的下载请求 | App → 平台 CDN | 平台可能记录；本仓库不接收 |
| 你的个人数据 | **无** | 本仓库不持有，故无留存、无共享、无跨境链路 |

共享方只有托管平台：**GitHub**（主源、Issues、PR）、**Gitee**（国内只读镜像）、以及二者使用的 CDN / Cloudflare 等基础设施（以平台实际部署为准）。我们**不出售、不出租、不用于广告、不向数据经纪人提供**任何数据。

## 六、不收集什么（当前版本）

不收集任何个人信息或设备信息（见第四节全清单）。当前版本**未实现**：账号体系、云端目录服务的用户标识、下载计数回传、安装回执、遥测、付费与订单处理、兑换码、年龄核验、自动化决策。README 中 `price` / `purchased` 字段是`.mox` 清单格式的预留位，**当前没有支付流程、没有购买记录**。

## 七、你能怎么查看、重置、删除

- 索引与包内容都是公开的静态文件，随时可读；**本仓库没有「你的数据」可供查看或删除**。
- 若你提交过 Issue / PR / Discussion，请到 GitHub（或 Gitee 镜像对应的上游 GitHub）按平台功能自行编辑/关闭/删除；Git 历史中的提交记录仍可能保留。
- 若你担心托管平台访问日志，请使用平台提供的隐私控制或网络层工具（如代理/离线镜像）；本仓库无法代为删除平台日志。
- App 侧的插件缓存、已安装包、启停标记由 **App 本地**管理，请在 moxsh 终端内卸载插件或清除 App 数据（见 moxsh-terminal 隐私政策）。

## 八、儿童

不面向未满 14 周岁的儿童，无账号、无年龄核验，不有意收集儿童信息。本仓库无交互入口；若儿童通过 GitHub 提交过内容，请监护人通过 GitHub 平台功能或 GitHub Issues 处理。

## 九、跨境

仓库内容公开托管于 GitHub 并在 Gitee 设有国内镜像，读取者可能位于任何国家/地区；托管平台可能在其全球网络分发这些**公开静态文件**。本仓库不传输、不处理任何个人数据，因此不存在「个人数据跨境」；平台自身的日志与分发按其条款处理。

## 十、第三方服务条款入口（不为其背书）

| 服务 | 条款 / 隐私政策入口 |
| --- | --- |
| GitHub | `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service` · `https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement` |
| Gitee | `https://gitee.com/`（以其站内公布的条款为准） |
| Cloudflare（若平台/镜像使用其基础设施） | `https://www.cloudflare.com/privacypolicy/` |
| 爱发电（仅当相关商品/赞助流程涉及，见 proot / 官网政策） | `https://afdian.com/` |

以各站最新公布条款为准，我们不代替其解释、不担保可用性、不对其行为负责。

## 十一、变更通知与联系方式

- 变更直接更新本仓库 `PRIVACY.md`，留痕于 Git 提交与 CHANGELOG；不收集联系方式，故**不主动推送**，重大变更在仓库公告。
- **唯一联系方式**：在对应仓库开 **GitHub Issues**（`https://github.com/codecloud-dev/<repo>/issues`），或联系 GitHub 账号 **`codecloud-dev`**。
- 不提供、不编造客服邮箱、电话、通信地址、公司名、注册号。请勿在公开 Issue 里贴密钥、token 或凭据。

---
---

# English

**Repository**: `codecloud-dev/moxsh-plugins` (the index and manifest repository for the moxsh plugin store)
**Effective date**: 2026-11-15
**Controller**: `codecloud-dev` — a personal GitHub account run by an individual developer, **not a company or legal entity**; no company name, registration number, registered address, or support phone.

> Chinese first, English after, in one file; the Chinese text controls in case of conflict.
> Written against the **actual contents** of `catalog.json` / `plugins.json` / `schema/` and the README. This repository is a **pure static data repository**: no server, no database, no cookies, no tracking. So "what we collect" is essentially "nothing" — but this policy spells out *why*, *who produces logs when files are downloaded*, and *the current package status*, rather than hiding behind boilerplate.
> Written in the spirit of GDPR / PIPL minimisation, purpose limitation and transparency; no statutory text is quoted or copied.

## 1. What this repository is

- It is **a set of static JSON files + JSON Schemas + plugin source directories**: `catalog.json` (the index the App consumes directly), `plugins.json` (full community index), `schema/catalog.schema.json` and `schema/entry-schema.json` (validation rules), and `plugins/`.
- Hosted on **GitHub** (the single source of truth, `codecloud-dev/moxsh-plugins`) with a **read-only Gitee mirror** (`gitee.com/codecloud-dev/moxsh-plugins`, synced hourly from GitHub).
- The repository itself **runs no code, receives no HTTP requests, writes no logs, has no accounts, sets no cookies, and sends no email**.

## 2. Where the network activity actually happens

The network activity belongs to **the App consuming the repository (moxsh Terminal)**, not to this repository:

- The App's `CloudStoreApi` fetches `<base>/catalog.json` (top level must be an object containing an `entries` array; each entry must have a `type`);
- It downloads `<base>/pkg/<id>.mox` by id;
- The cloud base is configurable and silently falls back to a built-in catalogue on failure (see the moxsh-terminal privacy policy).

When static files are read, the hosting platform (GitHub / Gitee / its CDN) records ordinary access logs (request IP, time, path, UA) under its own policy. **Those logs are produced and controlled by the platform; this repository does not read, receive, store, or delete them.**

## 3. What "data" is in the repository (all plugin metadata, not user data)

Each `entries[]` item in `catalog.json` (as of `1.0.3`) has:

`id`, `name`, `version`, `author`, `description`, `type` (plugin/skill/theme/rootfs), `minAppVersion`, `permissions`, `price`, `purchased`, `sizeBytes`, `tags`, `repository`, `path`, `packageStatus`, `minVersion`, `revokedVersions`; the top level also has `schemaVersion`, `repoVersion`, `updated`.

Of these, `minVersion` (the minimum installable version) and `revokedVersions` (version numbers confirmed vulnerable and forbidden to install/roll back to) are **trusted-catalogue declarations for the plugin version security policy**, read by the consuming App at install time to block rollbacks (see the special clauses in the moxsh-terminal / moxsh-plugins `TERMS.md`); they too are **plugin metadata, not user data**.

These describe **plugins**, not any visitor, user, device, or account. The two current entries are `hello-mox` (official minimal example plugin) and `glass-terminal-theme` (a theme).

**Honest status**: both entries have `packageStatus: "planned"` and `sizeBytes: 0` — i.e. **there are no actual downloadable `.mox` package bodies in the current version**; tapping install in the App shows "package source not configured", which is expected. The README explicitly forbids "filling in a size number that merely looks real".

`plugins.json`'s `plugins[]` targets community/tools and additionally contains `summary`, `repo`, `path`, `tags` — also plugin metadata.

## 4. What we collect

**Nothing.** Specifically:

- This repository does not collect: name, email, account, password, token, device identifier, IP, User-Agent, location, device form, language, theme, browsing behaviour, download behaviour, install statistics, crashes, telemetry.
- It sets: no cookies, no localStorage, no sessionStorage, no fingerprinting, no tracking pixels, no ad SDK, no analytics SDK.
- It offers: no login, comment backend, redemption, payment, messaging, or file upload (content changes go through GitHub Pull Requests).
- It uploads: no usage data to any `codecloud-dev` server (**there is no server**).

**Contributors**: if you open an Issue / Pull Request / Discussion on GitHub, your GitHub account info, submission content and timestamps are handled by **GitHub** under its terms; we see them only on the GitHub platform and do not build a separate store.

## 5. Retention, location, and sharing

| Item | Where | Notes |
| --- | --- | --- |
| Index JSON, Schemas, plugin sources | GitHub repository (and the read-only Gitee mirror) | **Publicly retained** in Git history; removal requires a commit, and historical commits remain traceable |
| Hosting-platform access logs | GitHub / Gitee / CDN | Retained by the platform under its policy; this repository never touches them and cannot delete them |
| Your download requests | App → platform CDN | The platform may log them; this repository receives nothing |
| Your personal data | **None** | Not held, so no retention, no sharing, no cross-border pipeline |

The only recipients are the hosting platforms: **GitHub** (source, Issues, PRs), **Gitee** (mainland-China read-only mirror), and whatever CDN / infrastructure (e.g. Cloudflare) they actually use. We **do not sell, rent, use for advertising, or provide to data brokers** any data.

## 6. What we do not collect (current version)

No personal or device information of any kind (full list in §4). **Not implemented**: accounts, user identifiers in a cloud catalogue service, download-count callbacks, install receipts, telemetry, payments/orders, redeem codes, age verification, automated decision-making. The `price` / `purchased` fields mentioned in the README are reserved slots in the `.mox` manifest format — **there is no payment flow and no purchase record in the current version**.

## 7. How to view, reset and delete

- Index and package contents are public static files, readable at any time; **there is no "your data" in this repository to view or delete**.
- If you submitted an Issue / PR / Discussion, edit/close/delete it using GitHub's own features (or the upstream GitHub repo for the Gitee mirror); Git history may still retain the commits.
- If you are concerned about platform access logs, use the platform's privacy controls or network-layer tools (proxy / offline mirror); this repository cannot delete platform logs on your behalf.
- App-side plugin caches, installed packages and enable/disable flags are managed **locally by the App** — uninstall the plugin inside moxsh Terminal or clear app data (see the moxsh-terminal privacy policy).

## 8. Children

Not directed at children under 14; no accounts, no age verification, no knowing collection of children's data. There is no interactive entry point here; if a child submitted content via GitHub, a guardian should use GitHub's features or GitHub Issues.

## 9. Cross-border transfers

Repository content is publicly hosted on GitHub with a mainland-China Gitee mirror, so readers may be in any country; the platforms may distribute these **public static files** across their global networks. This repository does not transmit or process any personal data, so there is no "cross-border transfer of personal data"; platform logs and distribution are governed by the platform's own terms.

## 10. Third-party terms (we do not endorse them)

| Service | Terms / privacy policy |
| --- | --- |
| GitHub | `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service` · `https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement` |
| Gitee | `https://gitee.com/` (see its published terms) |
| Cloudflare (if used by the platform / mirror) | `https://www.cloudflare.com/privacypolicy/` |
| Afdian (only where related goods/sponsorship flows apply; see the proot / website policies) | `https://afdian.com/` |

The latest published terms govern. We do not interpret them, guarantee availability, or take responsibility for them.

## 11. Changes and contact

- Changes update this repository's `PRIVACY.md` directly and appear in Git history / CHANGELOG. We collect no contact details, so **we do not push notifications**; significant changes are announced in the repository.
- **Only contact channels**: open a **GitHub Issue** at `https://github.com/codecloud-dev/<repo>/issues`, or reach the GitHub account **`codecloud-dev`**.
- No support email, phone, postal address, company name, or registration number is provided or invented here. Please do not post secrets, tokens, or credentials in a public Issue.
