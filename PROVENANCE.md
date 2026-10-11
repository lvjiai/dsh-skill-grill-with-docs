# Provenance

The plugin code in `lib/`, `tests/`, `cordis.patch.yml`, `package.json` and the
READMEs is original work by this repository's contributors, licensed MIT (see
[LICENSE](LICENSE)).

The skill bodies under `assets/` are **not** original. They are copied verbatim
from Matt Pocock's skills repository:

| | |
|---|---|
| Upstream | <https://github.com/mattpocock/skills> |
| Commit | `49dd158d1076134a641b33efb035946536778336` (2026-10-09) |
| Upstream license | MIT |

| Packaged asset | Upstream path | State |
|---|---|---|
| `assets/grill-with-docs/SKILL.md` | `skills/engineering/grill-with-docs/SKILL.md` | verbatim |
| `assets/grilling/SKILL.md` | `skills/productivity/grilling/SKILL.md` | **patched, see below** |
| `assets/domain-modeling/SKILL.md` | `skills/engineering/domain-modeling/SKILL.md` | verbatim |
| `assets/domain-modeling/GLOSSARY-FORMAT.md` | `skills/engineering/domain-modeling/GLOSSARY-FORMAT.md` | verbatim |
| `assets/domain-modeling/ADR-FORMAT.md` | `skills/engineering/domain-modeling/ADR-FORMAT.md` | verbatim |

Upstream `agents/openai.yaml` files are deliberately not packaged: they carry
OpenAI/Codex interface metadata that this provider does not read.

## Local delta: `grilling`

Upstream writes its interview protocol against a plain text channel, because it
targets any agent host. This package is DeepSeek Harness-only — it imports
`@deepseek-ai/dsh-skill`, declares `dsh.bundle.patch`, and peer-depends on DSH
packages — so host-neutrality buys nothing here and the DSH popup is strictly
better for the reader.

One region is therefore rewritten, and nothing else:

| Upstream | Here |
|---|---|
| "Format a round like so:" plus the `❓ **Q1**` / `➡️` fenced template, and "Word each question so 'yes' accepts your recommended answer." | The round is one `ask_user_question` call; its `id`/`header`/`question`/`options` fields are specified, the recommendation goes first with `(Recommended)`, open questions carry no `options`, and the upstream text block survives only as the documented fallback for when the tool is unavailable. |

Everything the patch keeps intact: the design tree, rounds, the frontier and how
it advances, "the whole frontier in one round", the recommended answer, waiting
for the user between rounds, facts-by-sub-agent, and the closing condition.
The upstream opening and closing paragraphs are unchanged, and
`tests/provider.test.js` asserts both the untouched edges and the patched
protocol, so an upstream refresh cannot silently drop the delta.

## Refreshing against a newer upstream commit

```sh
git clone --depth 1 https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cp /tmp/mattpocock-skills/skills/engineering/grill-with-docs/SKILL.md   assets/grill-with-docs/
cp /tmp/mattpocock-skills/skills/productivity/grilling/SKILL.md         assets/grilling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/SKILL.md   assets/domain-modeling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md assets/domain-modeling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/ADR-FORMAT.md      assets/domain-modeling/
```

Then **re-apply the `grilling` delta** from the table above — the copy above
deliberately overwrites it — update the commit pin, and run `npm test`, which
fails loudly if the delta is missing.

Update the commit pin above in the same change.

## Upstream license notice

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
