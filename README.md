# moxsh 插件商店

官方与社区插件的清单与发布仓库。moxsh App 启动插件商店时，会从本仓库根目录读取 `plugins.json` 作为索引。

## 插件清单格式（plugins.json）

```json
{
  "schema": 1,
  "updated": "2026-09-29",
  "plugins": [
    {
      "id": "hello-mox",
      "name": "Hello mox",
      "summary": "示例插件：演示 moxsh 插件清单格式",
      "description": "一个最小可运行示例，用于验证插件商店的拉取与安装流程。",
      "version": "1.0.0",
      "author": "codecloud-dev",
      "minAppVersion": "0.5.0",
      "repo": "codecloud-dev/moxsh-plugins",
      "path": "plugins/hello-mox",
      "tags": ["demo"]
    }
  ]
}
```

字段说明：

| 字段 | 含义 |
| --- | --- |
| `id` | 插件唯一标识（小写、连字符） |
| `name` / `summary` / `description` | 展示名称 / 一句话简介 / 详细说明 |
| `version` | 语义化版本号 |
| `author` | 作者 |
| `minAppVersion` | 要求的最低 moxsh 版本 |
| `repo` | 插件源码所在的 `owner/repo` |
| `path` | 插件在仓库内的目录 |
| `tags` | 标签，用于分类检索 |

## 提交你的插件

1. Fork 本仓库，在 `plugins/` 下放置你的插件目录；
2. 往 `plugins.json` 的 `plugins` 数组追加一条；
3. 发起 Pull Request，审核通过后即上架。

> 插件须为开源、无恶意行为；上架即视为同意以仓库许可证（GPL-3.0）分发。
