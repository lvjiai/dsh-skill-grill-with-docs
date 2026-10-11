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

Copied verbatim, with no modification:

| Packaged asset | Upstream path |
|---|---|
| `assets/grill-with-docs/SKILL.md` | `skills/engineering/grill-with-docs/SKILL.md` |
| `assets/grilling/SKILL.md` | `skills/productivity/grilling/SKILL.md` |
| `assets/domain-modeling/SKILL.md` | `skills/engineering/domain-modeling/SKILL.md` |
| `assets/domain-modeling/GLOSSARY-FORMAT.md` | `skills/engineering/domain-modeling/GLOSSARY-FORMAT.md` |
| `assets/domain-modeling/ADR-FORMAT.md` | `skills/engineering/domain-modeling/ADR-FORMAT.md` |

Upstream `agents/openai.yaml` files are deliberately not packaged: they carry
OpenAI/Codex interface metadata that this provider does not read.

To refresh the assets against a newer upstream commit:

```sh
git clone --depth 1 https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
cp /tmp/mattpocock-skills/skills/engineering/grill-with-docs/SKILL.md   assets/grill-with-docs/
cp /tmp/mattpocock-skills/skills/productivity/grilling/SKILL.md         assets/grilling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/SKILL.md   assets/domain-modeling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md assets/domain-modeling/
cp /tmp/mattpocock-skills/skills/engineering/domain-modeling/ADR-FORMAT.md      assets/domain-modeling/
npm test
```

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
