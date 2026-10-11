import assert from 'node:assert/strict'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { after, describe, it } from 'node:test'

import { apply, inject, name } from '../lib/index.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const ASSETS = join(ROOT, 'assets')
const TMP = join(ROOT, 'tests', '.tmp')
const CATALOG_ORDER = ['grill-with-docs', 'grilling', 'domain-modeling']
const FAKE_CONTROL = { signal: new AbortController().signal, invalidate: () => {} }

/** Drive `apply` with a stub registry and return the registered provider. */
function mount(module) {
  const factories = []
  module.apply({ skills: { registerProvider: (create) => factories.push(create) } })
  assert.equal(factories.length, 1, 'the plugin must register exactly one provider')
  return factories[0](FAKE_CONTROL)
}

/** Copy the shipped module into a throwaway tree so a variant can be broken on purpose. */
async function mountVariant(dirName, mutate) {
  const dir = join(TMP, dirName)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  await cp(join(ROOT, 'lib'), join(dir, 'lib'), { recursive: true })
  await cp(ASSETS, join(dir, 'assets'), { recursive: true })
  await mutate(dir)
  return mount(await import(pathToFileURL(join(dir, 'lib', 'index.js')).href))
}

/** Rewrite one packaged `SKILL.md` in a variant tree. */
async function rewriteSkill(dir, skill, text) {
  await writeFile(join(dir, 'assets', skill, 'SKILL.md'), text)
}

after(() => rm(TMP, { recursive: true, force: true }))

const provider = mount({ apply })

describe('plugin surface', () => {
  it('declares the cordis plugin shape', () => {
    assert.equal(name, 'skill-grill-with-docs')
    assert.deepEqual(inject, ['skills'])
    assert.equal(typeof apply, 'function')
  })

  it('registers a named provider on ctx.skills', () => {
    assert.equal(provider.name, 'mattpocock-skills')
  })
})

describe('provider.list', () => {
  it('returns the three packaged skills in catalog order', async () => {
    const candidates = await provider.list()
    assert.deepEqual(candidates.map((candidate) => candidate.name), CATALOG_ORDER)
  })

  it('tags every candidate as a packaged contribution at the bundled rank', async () => {
    for (const candidate of await provider.list()) {
      assert.equal(candidate.provider, 'mattpocock-skills')
      assert.equal(candidate.source, 'bundled')
      assert.equal(candidate.rank, 600, 'packaged providers use BUNDLED_SKILL_RANK')
      assert.equal(candidate.invocation.userInvocable, true)
      assert.ok(candidate.description.length > 0, 'the catalog description must not be empty')
      assert.equal(candidate.resourceBase.kind, 'directory')
      assert.equal(candidate.resourceBase.path, join(ASSETS, candidate.name))
      assert.equal(candidate.locator, candidate.name)
    }
  })

  it('keeps grill-with-docs out of model-facing catalogs only', async () => {
    const found = new Map((await provider.list()).map((candidate) => [candidate.name, candidate]))
    assert.equal(found.get('grill-with-docs').invocation.modelInvocable, false)
    assert.equal(found.get('grill-with-docs').invocation.userInvocable, true)
    assert.equal(found.get('grilling').invocation.modelInvocable, true)
    assert.equal(found.get('domain-modeling').invocation.modelInvocable, true)
  })

  it('re-parses the assets on every observation', async () => {
    const first = await provider.list()
    const second = await provider.list()
    assert.deepEqual(first.map((candidate) => candidate.name), second.map((candidate) => candidate.name))
    assert.notEqual(first, second, 'discovery must not hand out one shared array')
  })
})

describe('provider.get', () => {
  it('returns bodies stripped of frontmatter', async () => {
    for (const candidate of await provider.list()) {
      const skill = await provider.get(candidate)
      assert.equal(skill.name, candidate.name)
      assert.equal(skill.provider, 'mattpocock-skills')
      assert.equal(skill.description, candidate.description)
      assert.ok(!skill.content.startsWith('---'), `${candidate.name}: frontmatter delimiter leaked`)
      assert.ok(
        !skill.content.includes('disable-model-invocation'),
        `${candidate.name}: frontmatter keys leaked`,
      )
      assert.equal(skill.resourceBase.path, join(ASSETS, candidate.name))
      assert.equal(skill.content, skill.content.trim(), `${candidate.name}: body is not trimmed`)
    }
  })

  it('serves the upstream bodies verbatim', async () => {
    const candidates = new Map((await provider.list()).map((candidate) => [candidate.name, candidate]))

    // grill-with-docs is a one-line delegation, so its body is exactly that line.
    const grillWithDocs = await provider.get(candidates.get('grill-with-docs'))
    assert.equal(
      grillWithDocs.content,
      'Call the Skill tool twice, for "grilling" and "domain-modeling".',
    )

    const grilling = await provider.get(candidates.get('grilling'))
    assert.ok(grilling.content.startsWith('Interview the user relentlessly until you reach a shared understanding.'))
    assert.ok(grilling.content.includes('**design tree**'))
    assert.ok(grilling.content.endsWith('Do not act on it until the user confirms you have reached a shared understanding.'))

    const domainModeling = await provider.get(candidates.get('domain-modeling'))
    assert.ok(domainModeling.content.startsWith('# Domain Modeling\n'))
    assert.ok(domainModeling.content.includes('./GLOSSARY-FORMAT.md'))
  })

  it('takes the body verbatim from the asset, minus frontmatter', async () => {
    for (const candidate of await provider.list()) {
      const skill = await provider.get(candidate)
      const raw = await readFile(join(ASSETS, candidate.name, 'SKILL.md'), 'utf8')
      assert.ok(raw.includes(skill.content), `${candidate.name}: body is not a verbatim slice`)
      assert.ok(!raw.startsWith(skill.content), `${candidate.name}: frontmatter was not removed`)
    }
  })

  it('returns undefined for a locator this provider does not own', async () => {
    assert.equal(await provider.get({ locator: 'not-a-bundled-skill' }), undefined)
    assert.equal(await provider.get({ locator: 42 }), undefined)
    assert.equal(await provider.get({}), undefined)
  })
})

describe('packaging failures fail loudly', () => {
  it('reports a missing skill body instead of dropping the skill', async () => {
    const variant = await mountVariant('missing-body', async (dir) => {
      await rm(join(dir, 'assets', 'grilling', 'SKILL.md'))
    })
    await assert.rejects(variant.list(), /grilling/)
  })

  it('rejects a non-kebab-case skill name', async () => {
    const variant = await mountVariant('bad-name', (dir) => rewriteSkill(
      dir,
      'grilling',
      '---\nname: Not Kebab Case\ndescription: Broken.\n---\n\nBody.\n',
    ))
    await assert.rejects(variant.list(), /kebab-case/)
  })

  it('rejects a name that disagrees with its directory', async () => {
    const variant = await mountVariant('name-mismatch', (dir) => rewriteSkill(
      dir,
      'grilling',
      '---\nname: relocation\ndescription: Broken.\n---\n\nBody.\n',
    ))
    await assert.rejects(variant.list(), /does not match its directory/)
  })

  it('rejects an unparsable invocation boolean', async () => {
    const variant = await mountVariant('bad-boolean', (dir) => rewriteSkill(
      dir,
      'grilling',
      '---\nname: grilling\ndescription: Broken.\ndisable-model-invocation: maybe\n---\n\nBody.\n',
    ))
    await assert.rejects(variant.list(), /must be a boolean/)
  })

  it('rejects a bundle with no frontmatter', async () => {
    const variant = await mountVariant('no-frontmatter', (dir) => rewriteSkill(
      dir,
      'grilling',
      '# Grilling\n\nNo frontmatter here.\n',
    ))
    await assert.rejects(variant.list(), /missing its YAML frontmatter/)
  })
})
