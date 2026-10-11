# dsh-skill-grill-with-docs

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 技能提供方插件，把 Matt Pocock 的
[`grill-with-docs`](https://github.com/mattpocock/skills)、`grilling`、`domain-modeling` 三个技能打包分发，**无需**本地技能目录
即可进入会话技能目录。

插件只是分发渠道；技能正文从上游原样复制，并始终是唯一事实来源。发现阶段解析其 frontmatter，每次加载都重新读取正文，因此修改
资源文件不需要任何缓存失效处理。

## 提供的三个技能

| 技能 | 可由谁调用 | 作用 |
|---|---|---|
| `grill-with-docs` | 仅你本人，通过 `/grill-with-docs` | 入口。就一份计划或设计反复盘问，同时把 `GLOSSARY.md` 与 ADR 写进你的仓库。 |
| `grilling` | 你，以及模型 | 盘问引擎：把设计树拆成分轮次推进的「前沿」。 |
| `domain-modeling` | 你，以及模型 | 落盘纪律：术语表与 ADR 的格式，以及一个决策何时才配得上 ADR。 |

## 为什么 `grill-with-docs` 不会出现在模型目录里

上游给它标了 `disable-model-invocation: true`，本插件保留该语义：注册为 `modelInvocable: false`、
`userInvocable: true`。agent 不会自己想到用它——输入 `/grill-with-docs` 是它唯一的入口，该手势会把完整指令注入当步。

这是有意设计，不是打包事故。它的正文只有一行——*「Call the Skill tool twice, for `grilling` and `domain-modeling`」*
——所以另外两个技能**必须**保持模型可调用，否则这条委派链无法完成。

（被隐藏的只是**目录条目**，`ctx.skills.get('grill-with-docs')` 依然能取到正文。把正文从工具层面挡住是
`dsh-tool-skill` 那一层的职责，它做得是对的。）

## 安装

```sh
# 从 npm
dsh plugin --profile <profile> add dsh-skill-grill-with-docs

# 从 git 仓库
dsh plugin --profile <profile> add github:<owner>/dsh-skill-grill-with-docs

# 本地开发时，直接链接本目录
dsh plugin --profile <profile> add link:<本仓库绝对路径>
```

安装命令会用已安装的包去核对 `dsh.profile.bundles`，并合并本包自带的
[`cordis.patch.yml`](cordis.patch.yml)——即一条插入插件行的 `insert`。不需要手改 profile 文件。随包分发的提供方在启动时挂载，
所以**装完请重启 Harness**，然后确认该行已合并：

```sh
dsh --profile <profile> --dump-config
```

> **`desktop` profile 不走 CLI。** 它由 Electron 应用独占管理，`dsh --profile desktop ...` 会直接报错
> *「profile desktop is managed exclusively by the Electron application」*。该 profile 请改用应用内的插件管理器安装。

## 先删掉本地同名副本

技能根目录的优先级高于随包分发的提供方。如果这三个技能同时以本地目录形式存在，本地副本会胜出，本插件会被静默遮蔽：

| 优先级 | 根目录 | 来源标签 |
|---|---|---|
| 100 | `<项目>/.dsh/skills` | `project-dsh` |
| 200 | `<项目>/.agents/skills` | `project-agents` |
| 300 | 配置的 `customSkillDirs` | `custom` |
| 400 | `$DSH_HOME/skills` | `user-dsh` |
| 500 | `~/.agents/skills` | `user-agents` |
| **600** | **随包分发的提供方（本插件）** | `bundled` |

优先级数字越小越优先，所以 `$DSH_HOME/skills` 下的副本（400）会压过本插件（600）。切换到插件渠道前，请从这类根目录中删除
`grill-with-docs/`、`grilling/`、`domain-modeling/` 三个目录。

这里**故意不做规避**：项目本地的覆盖理应继续压过随包技能，因此本提供方使用官方规定的随包优先级，而不是插队。

## 如何确认已挂载

`skill` 工具的目录里会列出 `grilling` 和 `domain-modeling`，但不会列出 `grill-with-docs`——这是预期状态，不是安装失败。要确认
是随包提供方在供数，加载任一技能并查看其资源基目录：它应该指向本包的 `assets/`，而不是某个本地技能根目录。

## 兼容性

| | |
|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` |
| Node.js | `>=24` |
| `@deepseek-ai/dsh-skill` | `0.2.0-rc.2`（peer） |
| `@deepseek-ai/cordis` | `~4.0.4`（peer） |

## 开发

```sh
pnpm install
pnpm test
```

`tests/provider.test.js` 用桩注册表驱动提供方，并覆盖各种打包故障路径；`tests/integration.test.js` 通过真实的 cordis `Context`
把插件挂到真实的 `SkillRegistry` 上。

要随上游新提交刷新随包技能正文，请按 [PROVENANCE.md](PROVENANCE.md) 操作——其中列出了确切的源路径、固定的 commit 以及复制命令。

## 许可与来源

MIT。插件代码为原创；`assets/` 下的五个文件从 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT，© 2026 Matt
Pocock）原样复制，固定在 commit `49dd158d1076134a641b33efb035946536778336`。文件级对应关系、上游许可声明与刷新流程见
[PROVENANCE.md](PROVENANCE.md)。
