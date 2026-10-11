# dsh-skill-grill-with-docs

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) skill provider that packages Matt Pocock's
[`grill-with-docs`](https://github.com/mattpocock/skills), `grilling` and `domain-modeling` skills, so they reach the
session skill catalog **without** a local skill root.

The plugin is the distribution channel; the skill bodies come from upstream and their frontmatter stays the single
source of truth. Discovery parses it and every load re-reads the body, so editing an asset needs no cache
invalidation.

Four of the five bodies are byte-identical to upstream. `grilling` carries one documented change: its interview round
goes through this harness's `ask_user_question` popup rather than an upstream text template, with the text form kept as
the fallback. See [PROVENANCE.md](PROVENANCE.md).

## What you get

| Skill | Invocable by | Purpose |
|---|---|---|
| `grill-with-docs` | you, via `/grill-with-docs` | The entry point. A relentless interview about a plan or design that writes `GLOSSARY.md` and ADRs into your repo as it goes. |
| `grilling` | you, and the model | The interview engine: a design tree worked in rounds, one frontier at a time. |
| `domain-modeling` | you, and the model | The writing discipline: glossary and ADR formats, and when a decision deserves an ADR. |

## Why `grill-with-docs` never appears in the model's catalog

Upstream ships it with `disable-model-invocation: true`, and this package preserves that: the skill is registered with
`modelInvocable: false` and `userInvocable: true`. The agent will not reach for it on its own — typing
`/grill-with-docs` is its only entry point, and that gesture injects the full instructions into the step.

That is deliberate, not a packaging accident. Its body is one line — *"Call the Skill tool twice, for `grilling` and
`domain-modeling`"* — so the other two skills **must** stay model-invocable, or the delegation cannot complete.

(Because only the *catalog entry* is hidden, `ctx.skills.get('grill-with-docs')` still resolves. Hiding the body from
the tool is the `dsh-tool-skill` layer's job, and it does it correctly.)

## Install

```sh
# from npm
dsh plugin --profile <profile> add dsh-skill-grill-with-docs

# from a git host
dsh plugin --profile <profile> add github:lvjiai/dsh-skill-grill-with-docs

# from a local checkout, while developing
dsh plugin --profile <profile> add link:<absolute-path-to-this-repo>
```

The install reconciles `dsh.profile.bundles` against installed packages and merges this package's
[`cordis.patch.yml`](cordis.patch.yml) — one `insert` of the plugin row. No profile edits are needed. Packaged
providers mount at boot, so **restart the harness** afterwards, then confirm the row merged:

```sh
dsh --profile <profile> --dump-config
```

> **The `desktop` profile is exempt from the CLI.** It is managed exclusively by the Electron application, and
> `dsh --profile desktop ...` fails with *"profile desktop is managed exclusively by the Electron application"*. Install
> this package through that application's plugin manager instead.

## Remove any local copy of these skills first

Skill roots outrank packaged providers. If the same three skills also exist as local directories, the local copy wins
and this package is silently shadowed:

| Rank | Root | Source label |
|---|---|---|
| 100 | `<project>/.dsh/skills` | `project-dsh` |
| 200 | `<project>/.agents/skills` | `project-agents` |
| 300 | configured `customSkillDirs` | `custom` |
| 400 | `$DSH_HOME/skills` | `user-dsh` |
| 500 | `~/.agents/skills` | `user-agents` |
| **600** | **packaged providers (this one)** | `bundled` |

Lower ranks win duplicate names, so a copy under `$DSH_HOME/skills` (rank 400) beats this package (rank 600). Delete
`grill-with-docs/`, `grilling/` and `domain-modeling/` from any such root before switching to the plugin channel.

Deliberately *not* worked around: a project-local override should keep beating a packaged skill, so this provider
claims the documented packaged rank rather than jumping the queue.

## Verify a mount

The `skill` tool's catalog lists `grilling` and `domain-modeling` but not `grill-with-docs` — that is the expected
state, not a failed install. To confirm the packaged provider is the one serving them, load a skill and check its
resource base: it should point inside this package's `assets/`, not at a local skill root.

## Requirements

| | |
|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` |
| Node.js | `>=24` |
| `@deepseek-ai/dsh-skill` | `0.2.0-rc.2` (peer) |
| `@deepseek-ai/cordis` | `~4.0.4` (peer) |

## Development

```sh
pnpm install
pnpm test
```

`tests/provider.test.js` drives the provider through a stub registry and covers the packaging failure modes;
`tests/integration.test.js` mounts the plugin on the real `SkillRegistry` through a real cordis `Context`.

To refresh the packaged skill bodies against a newer upstream commit, follow
[PROVENANCE.md](PROVENANCE.md) — it lists the exact source paths, the pinned commit, and the copy commands.

## License and provenance

MIT. The plugin code is original; the five files under `assets/` come from
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT, © 2026 Matt Pocock), pinned to commit
`49dd158d1076134a641b33efb035946536778336` — four byte-identical, and `grilling` carrying the popup delta described
above. See [PROVENANCE.md](PROVENANCE.md) for the file-by-file state, the delta, the upstream license notice, and the
refresh procedure.
