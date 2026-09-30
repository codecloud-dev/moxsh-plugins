# moxsh 插件商店

官方与社区插件的索引与清单仓库。moxsh App 的插件商店从这里读取目录，按 id 下载 `.mox` 包安装。

## 仓库结构

```text
moxsh-plugins/
├── catalog.json              # App 直接消费的索引（entries 数组）
├── plugins.json              # 社区索引，含 repo / path / tags 等全量元数据
└── plugins/
    └── hello-mox/
        └── plugin.json       # 单个插件的完整清单（遵循统一 Schema）
```

## App 如何消费本仓库

moxsh App 内 `StoreRepository.CloudStoreApi` 的行为：

- 拉取 `<base>/catalog.json`，要求**顶层是对象、内含 `entries` 数组**；
- 每条 entry **必须带 `type`**——缺失会导致 `JSONObject.getString("type")` 直接抛错、整个商店目录解析失败；
- 包下载走 `<base>/pkg/<id>.mox`。

因此对外提供索引时是 `catalog.json` + `entries`，而不是 `plugins.json` + `plugins`。

## catalog.json 字段

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `id` | 是 | 插件唯一标识，仅字母数字与 `.` `_` `-`，不以 `.` 开头 |
| `name` | 是 | 展示名称 |
| `version` | 是 | 语义化版本号 |
| `type` | **是** | `plugin` / `skill` / `theme` / `rootfs`，缺此字段 App 会解析失败 |
| `author` | 否 | 作者名 |
| `description` | 否 | 详细说明，卡片展示 |
| `minAppVersion` | 否 | 要求的最低 moxsh 版本 |
| `permissions` | 否 | 权限列表 |
| `price` | 否 | 价格，`0` 为免费 |
| `purchased` | 否 | 已购标记 |
| `sizeBytes` | 否 | 包体积，卡片显示"约 x MB" |

## 完整清单规范

每个插件目录下的 `plugin.json` 是插件的完整清单（含兼容矩阵、分发方式、入口点、能力、授权等），
字段遵循统一 Schema：

- Schema：`moxsh-suite` 仓库的 `spec/plugin-manifest.schema.json`（Draft 2020-12，41 个顶层字段）
- 示例：`spec/examples/` 下五套（开源免费 / 闭源免费 / 闭源付费 / 订阅制 / 系统内置）

地址：<https://github.com/codecloud-dev/moxsh-suite/tree/master/spec>

## 提交你的插件

1. Fork 本仓库，在 `plugins/<插件 id>/` 下放 `plugin.json`；
2. 往 `plugins.json` 的 `plugins` 数组追加一条（含 `repo` / `path` / `tags`）；
3. **同步往 `catalog.json` 的 `entries` 追加一条**——App 只读这个文件，务必带 `type`；
4. 发起 Pull Request，审核通过后即上架。

> 插件须为开源、无恶意行为；上架即视为同意以仓库许可证分发。

## 当前状态

`.mox` 打包流程尚未接入 CI，`catalog.json` 里的 `sizeBytes` 暂为 `0` 占位；
包体未就绪时，App 点安装会提示"包源未配置"，属预期表现。

---

moxsh · 让手机上的 Linux 像 iOS 一样顺滑。
