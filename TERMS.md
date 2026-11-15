# 用户协议 / 服务条款（Terms of Service）

**适用仓库**：`codecloud-dev/moxsh-plugins`（moxsh 插件商店的索引与清单仓库）
**生效日期 / Effective date**：2026-11-15
**协议主体**：`codecloud-dev` —— 一个 GitHub 个人账号，由个人开发者运营，**不是公司、不是法人实体**；没有公司名称、注册号、注册地址或客服电话。

> 中文在前，英文在后，同一份文件；口径一致，歧义以中文为准。
> 本文件与 `PRIVACY.md` 配套：数据行为以 `PRIVACY.md` 为准，使用条件以本文件为准。
> 本仓库按 **MIT**（`LICENSE`）授权。本条款不缩减 MIT 授予你的任何权利；冲突时以 `LICENSE` 为准。

---

## 一、接受条款

克隆、浏览、读取 `catalog.json` / `plugins.json`，或由 App 拉取本索引、下载 `.mox` 包，即表示你已阅读并同意本条款与 `PRIVACY.md`。不同意请停止使用本仓库内容。

本仓库是**纯静态数据仓**：没有服务端、没有账号、没有付费、没有上传入口。README 如实标注：当前两条 entry 的 `packageStatus` 为 `"planned"`、`sizeBytes` 为 `0`，**当前版本没有实际可下载的 `.mox` 包体**，App 点安装提示「包源未配置」属预期表现。

## 二、内容按「现状」提供与免责

- 索引、Schema、插件源码按 **「现状」（AS IS）** 提供，不附带任何明示或默示担保，包括准确性、完整性、可用性、及时性、不侵权、无恶意代码。
- `catalog.json` / `plugins.json` 里的 `version`、`permissions`、`price`、`purchased`、`sizeBytes`、`packageStatus`、`tags` 等是**插件元数据**，不构成对插件功能、安全性、兼容性、体积或可购买性的承诺。
- **插件由各自作者负责**。`.mox` 包内的代码、脚本、主题、技能不由我们担保；安装第三方插件的风险由你自行承担。验签（HMAC-SHA256）只证明包未被篡改且来自持有密钥的构建方，**不担保包内代码安全或无害**。
- 在适用法律允许的最大范围内，我们不对任何直接、间接、附带、特殊或后果性损失（含数据丢失、设备损坏、业务中断）承担责任，即使已被告知可能发生。
- 当前版本**未实现**：支付流程、购买记录、订单、兑换、账号体系、自动更新服务、官方技术支持 SLA。

## 三、可接受使用（AUP）

- 遵守你所在国家/地区的法律，以及 GitHub / Gitee、CDN、包源站各自条款。
- 不得利用索引或插件传播恶意软件、入侵他人系统、抓取未授权数据、发起拒绝服务、规避授权或计费、实施诈骗。
- 提交 Issue / Pull Request / Discussion 时，不提交他人隐私、密钥、token、恶意样本或侵权内容；不把本仓库当作绕过其它服务授权、验签、权限门禁的工具。
- 你自行判断包源可信度；离线安装（把 `.mox` 放到下载目录）同样由你自行承担风险。
- 我们保留在明显滥用时拒绝合并 PR、下架条目的权利，但**无义务监控**，也不为第三方插件背书。

## 四、禁止逆向滥用与绕过授权

- 允许：阅读、复制、修改、再分发本仓库的 JSON、Schema 与示例源码 —— 这些是 **MIT 明确授予的权利**，本条款不限制；为互操作性而进行的分析亦不受限。
- 禁止的是**以规避授权与安全机制为目的的滥用**，包括但不限于：
  - 伪造 `MOX_STORE_SECRET` 签名、篡改 `.mox` 包清单、绕过 App 侧 `MoxPackage.verify()` 验签以取得未授权权限；
  - 篡改 `permissions` / `minAppVersion` / `version` 字段以绕过默认拒绝闸门或版本安全策略；
  - 绕过本系列（moxsh-terminal / moxsh-proot / mox-id / Fenestra）已有的兑换码、设备绑定、商业授权或付费门禁；
  - 以本仓库为渠道批量伪造插件、投毒、劫持更新或冒充官方包。
- 上述禁止不扩张为「禁止一切逆向」：MIT 授予的使用、修改、再分发权利完整保留；被禁止的是**用于绕过授权、侵犯他人或规避付费**的具体滥用行为。

## 五、插件版本安全策略（用户义务）

> 与 moxsh-terminal `TERMS.md` 第六节同一口径。该机制由本项目另一条开发线实现；本条款**只规定用户义务，不描述、不承诺其具体实现方式与当前进度，也不虚构任何实现细节**；实现行为以届时发布的客户端与本仓库 `catalog.json` 的 `minVersion` / `revokedVersions` 声明为准。

1. **禁止回滚到存在已知漏洞的旧版本**：被标记为存在已知安全漏洞的插件版本，你不得降级、回滚、侧载、强制安装，也不得在索引中把该版本伪装/推荐为新版本（含修改 `version`、`packageStatus`、替换包体、从旧缓存恢复）。
2. **不得绕过该机制**：不得禁用、篡改、拦截或伪造版本安全校验，不得用非官方渠道包绕过校验。
3. **理由与后果**：终端及其容器常持有敏感数据，重新引入已知漏洞会扩大风险面；客户端可拒绝安装、拒绝启用或禁用被标记版本，由此导致的不可用按第二节「按现状提供」由你自行承担。合规路径是升级到修复版本、卸载插件、或从官方源重装。
4. 作为插件提交者，若发现已发布版本存在已知漏洞，应及时标注并配合发布修复版本，**不得**通过删除/回滚索引来掩盖漏洞版本。

## 六、第三方服务（链接指向，不为其背书）

| 服务 | 用途 | 条款 / 隐私政策入口 |
| --- | --- | --- |
| GitHub | 唯一主源、Issues、PR、主仓托管 | `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service` · `https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement` |
| Gitee | 国内只读镜像（每小时从 GitHub 同步） | `https://gitee.com/`（以其站内公布条款为准） |
| 爱发电 | 仅当相关商品/赞助兑换流程涉及（见 proot、官网政策） | `https://afdian.com/`（以其站内公布条款为准） |
| Cloudflare | 若平台/镜像使用其基础设施 | `https://www.cloudflare.com/privacypolicy/` |

以各站最新公布条款为准；我们**不代替它们解释、不担保可用性、不对其行为负责、不为其背书**。第三方中断、改版、限流或条款变化，我们不承担责任。

## 七、知识产权与许可

- 本仓库 JSON / Schema / 示例源码按 **MIT**（`LICENSE`，Copyright (c) 2026 codecloud-dev (MoX Series)）授权：可自由使用、复制、修改、再分发，只需保留版权与许可声明。**本条款不叠加额外限制、不收费、不改变 MIT**。
- 各 `.mox` 插件包、主题、技能由各自作者按其声明的许可负责；`author` / `tags` / `repository` 字段只是索引元数据，不代表权利转让或官方背书。
- `moxsh` 名称与品牌标识版权归 `codecloud-dev`；MIT 对文件的授权不等于商标授权。
- 你提交的 Issue / PR 视为同意按仓库 `CONTRIBUTING.md` 与 MIT 公开处理。

## 八、变更、终止与争议

- 变更直接更新本仓库 `TERMS.md`，留痕于 Git 提交与 CHANGELOG；不收集联系方式，故**不主动推送**，重大变更在仓库公告。继续使用视为接受。
- 你可随时终止：停止读取索引、删除本地克隆与缓存、在 App 内卸载相关插件。终止不影响终止前已发生的合法行为，也不自动删除 Git 历史中的公开提交或第三方平台日志。
- 因不可抗力、平台下架、镜像同步失败、包源失效导致的不可用，我们不承担责任。
- 争议应先友好协商；协商不成，提交**版权人所在地有管辖权的法院**处理。本条款以中文书写，英文仅为阅读便利，歧义以中文为准。部分条款无效不影响其余条款效力。

## 九、联系方式

- **唯一联系方式**：在对应仓库开 **GitHub Issues**（`https://github.com/codecloud-dev/<repo>/issues`），或联系 GitHub 账号 **`codecloud-dev`**。
- 不提供、不编造客服邮箱、电话、通信地址、公司名、注册号。请勿在公开 Issue 里贴密钥、token 或凭据。

---
---

# English — Terms of Service

**Repository**: `codecloud-dev/moxsh-plugins` (index and manifest repository for the moxsh plugin store)
**Effective date**: 2026-11-15
**Party**: `codecloud-dev` — a personal GitHub account run by an individual developer, **not a company or legal entity**; no company name, registration number, registered address, or support phone.

> Chinese first, English after, in one file; the Chinese text controls in case of conflict.
> Pairs with `PRIVACY.md`: data practices are governed by `PRIVACY.md`, terms of use by this document.
> Licensed under **MIT** (`LICENSE`). These terms do not reduce any right MIT grants you; where this document conflicts with `LICENSE`, `LICENSE` controls.

## 1. Acceptance

Cloning, browsing, or reading `catalog.json` / `plugins.json`, or having an App fetch this index and download `.mox` packages, means you have read and agree to these terms and to `PRIVACY.md`. If you do not agree, stop using this repository's content.

This is a **pure static data repository**: no server, no accounts, no payments, no upload endpoint. The README states honestly that both current entries have `packageStatus: "planned"` and `sizeBytes: 0` — **there are no actual downloadable `.mox` package bodies in the current version**, and the App showing "package source not configured" on install is expected.

## 2. "As is" and disclaimer

- The index, Schemas and plugin sources are provided **"AS IS"**, without any express or implied warranty of accuracy, completeness, availability, timeliness, non-infringement, or freedom from malicious code.
- Fields in `catalog.json` / `plugins.json` — `version`, `permissions`, `price`, `purchased`, `sizeBytes`, `packageStatus`, `tags` — are **plugin metadata** and are not a promise about a plugin's functionality, safety, compatibility, size, or purchasability.
- **Plugins are the responsibility of their respective authors.** Code, scripts, themes and skills inside `.mox` packages are not warranted by us; you bear the risk of installing third-party plugins. Signature verification (HMAC-SHA256) only proves a package was not tampered with and came from a builder holding the key — **it does not warrant that the code inside is safe or harmless**.
- To the maximum extent permitted by law, we are not liable for any direct, indirect, incidental, special, or consequential loss (including data loss, device damage, business interruption), even if advised of the possibility.
- **Not implemented**: payment flow, purchase records, orders, redemption, an account system, an automatic update service, or an official support SLA.

## 3. Acceptable use (AUP)

- Comply with the law of your country/region and with the terms of GitHub / Gitee, CDNs, and package sources.
- Do not use the index or plugins to spread malware, intrude into others' systems, scrape unauthorised data, launch denial-of-service, evade authorisation or billing, or commit fraud.
- When submitting Issues / Pull Requests / Discussions, do not submit others' private data, keys, tokens, malicious samples, or infringing content; do not use this repository as a tool to bypass another service's authorisation, signature verification, or permission gates.
- You judge package-source trustworthiness yourself; offline installation (placing a `.mox` in the download directory) is likewise at your own risk.
- We reserve the right to reject PRs or remove entries in cases of obvious abuse, but have **no duty to monitor** and do not endorse third-party plugins.

## 4. No abusive reverse engineering / no bypassing authorisation

- Allowed: reading, copying, modifying and redistributing this repository's JSON, Schemas and example sources — these are **rights expressly granted by MIT**, unrestricted by these terms; analysis for interoperability is likewise unrestricted.
- Prohibited is **abuse aimed at circumventing authorisation and security mechanisms**, including but not limited to:
  - Forging `MOX_STORE_SECRET` signatures, tampering with `.mox` manifests, or bypassing the App-side `MoxPackage.verify()` check to obtain unauthorised permissions;
  - Altering `permissions` / `minAppVersion` / `version` to bypass the default-deny gate or the version security policy;
  - Bypassing existing redeem-code, device-binding, commercial-licensing, or paywall gates of this series (moxsh-terminal / moxsh-proot / mox-id / Fenestra);
  - Using this repository as a channel to bulk-forge plugins, poison packages, hijack updates, or impersonate official packages.
- This does **not** expand into "all reverse engineering is forbidden": the use, modification and redistribution rights granted by MIT remain intact; what is prohibited is the specific abusive conduct of bypassing authorisation, infringing others, or evading payment.

## 5. Plugin version security policy (user obligations)

> Same wording as §6 of the moxsh-terminal `TERMS.md`. The mechanism is implemented by another workstream of this project; these terms **state only user obligations and do not describe, promise, or invent any implementation detail or current status**. Actual behaviour follows the client released at that time and the `minVersion` / `revokedVersions` declarations in this repository's `catalog.json`.

1. **No rollback to versions with known vulnerabilities**: for a plugin version flagged as having a known security vulnerability, you must not downgrade, roll back, sideload, or force-install it, nor disguise/recommend it as a newer version in the index (including editing `version` / `packageStatus`, replacing package bodies, or restoring from an old cache).
2. **No bypassing the mechanism**: you must not disable, tamper with, intercept, or forge the version security check, nor use non-official packages to bypass it.
3. **Rationale and consequences**: terminals and their containers often hold sensitive data; reintroducing a known vulnerability enlarges the attack surface. The client may refuse to install, refuse to enable, or disable a flagged version; any resulting unavailability is borne by you under §2 ("as is"). The compliant path is to upgrade to a fixed version, uninstall the plugin, or reinstall from the official source.
4. As a plugin submitter, if you discover a known vulnerability in a released version, you should flag it promptly and cooperate on publishing a fixed version; you **must not** conceal the vulnerable version by deleting or rolling back the index.

## 6. Third-party services (links only, no endorsement)

| Service | Purpose | Terms / privacy policy |
| --- | --- | --- |
| GitHub | Single source of truth, Issues, PRs, canonical hosting | `https://docs.github.com/en/site-policy/github-terms/github-terms-of-service` · `https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement` |
| Gitee | Mainland-China read-only mirror (synced hourly from GitHub) | `https://gitee.com/` (see its published terms) |
| Afdian | Only where related goods/sponsorship redemption flows apply (see the proot and website policies) | `https://afdian.com/` (see its published terms) |
| Cloudflare | If the platform / mirror uses its infrastructure | `https://www.cloudflare.com/privacypolicy/` |

The latest published terms govern; we **do not interpret them, guarantee availability, take responsibility for them, or endorse them**. We are not liable for third-party outages, changes, rate limits, or term changes.

## 7. Intellectual property and licence

- Repository JSON / Schemas / example sources are licensed under **MIT** (`LICENSE`, Copyright (c) 2026 codecloud-dev (MoX Series)): free to use, copy, modify and redistribute, retaining the copyright and licence notice. **These terms add no extra restrictions, charge no fee, and do not change MIT**.
- Individual `.mox` packages, themes and skills are governed by their own authors' declared licences; `author` / `tags` / `repository` are index metadata and imply no rights transfer or official endorsement.
- The `moxsh` name and branding are copyright `codecloud-dev`; an MIT grant over files is not a trademark grant.
- Content you submit as Issues / PRs is treated as agreed to be handled publicly under `CONTRIBUTING.md` and MIT.

## 8. Changes, termination and disputes

- Changes update this repository's `TERMS.md` directly and appear in Git history / CHANGELOG. We collect no contact details, so **we do not push notifications**; significant changes are announced in the repository. Continued use constitutes acceptance.
- You may terminate at any time: stop reading the index, delete local clones and caches, and uninstall related plugins in the App. Termination does not affect lawful conduct before termination and does not automatically delete public commits in Git history or third-party platform logs.
- We are not liable for unavailability caused by force majeure, platform takedown, mirror sync failure, or package-source failure.
- Disputes should first be resolved amicably; failing that, they are submitted to the **court of competent jurisdiction at the copyright holder's location**. These terms are written in Chinese; the English text is for convenience only and the Chinese controls. Invalidity of one clause does not affect the rest.

## 9. Contact

- **Only contact channels**: open a **GitHub Issue** at `https://github.com/codecloud-dev/<repo>/issues`, or reach the GitHub account **`codecloud-dev`**.
- No support email, phone, postal address, company name, or registration number is provided or invented here. Please do not post keys, tokens, or credentials in a public Issue.
