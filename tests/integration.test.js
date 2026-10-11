/**
 * Mounts the plugin on the real `@deepseek-ai/dsh-skill` registry through a
 * real cordis context, so the provider contract is exercised end to end
 * rather than against a hand-written stub.
 */
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { Context } from '@deepseek-ai/cordis'
import SkillRegistry, { isModelInvocable, isUserInvocable } from '@deepseek-ai/dsh-skill'

import * as plugin from '../lib/index.js'

describe('mounts on the real skill registry', () => {
  /** @type {Context} */
  let ctx
  /** @type {import('@deepseek-ai/dsh-skill').SkillSummary[]} */
  let catalog
  let registryFiber
  let pluginFiber

  before(async () => {
    ctx = new Context()
    registryFiber = ctx.plugin(SkillRegistry)
    await registryFiber
    pluginFiber = ctx.plugin(plugin)
    await pluginFiber
    catalog = await ctx.skills.list()
  })

  after(async () => {
    await pluginFiber?.dispose()
    await registryFiber?.dispose()
  })

  it('publishes exactly the three packaged skills', () => {
    assert.deepEqual(
      catalog.map((skill) => skill.name),
      ['domain-modeling', 'grill-with-docs', 'grilling'],
    )
  })

  it('attributes every skill to this provider', () => {
    for (const skill of catalog) {
      assert.equal(skill.provider, 'mattpocock-skills')
      assert.equal(skill.source, 'bundled')
    }
  })

  it('exposes grill-with-docs to humans only, and its dependencies to the model', () => {
    const byName = new Map(catalog.map((skill) => [skill.name, skill]))

    assert.equal(isModelInvocable(byName.get('grill-with-docs')), false)
    assert.equal(isUserInvocable(byName.get('grill-with-docs')), true)

    assert.equal(isModelInvocable(byName.get('grilling')), true)
    assert.equal(isUserInvocable(byName.get('grilling')), true)

    assert.equal(isModelInvocable(byName.get('domain-modeling')), true)
    assert.equal(isUserInvocable(byName.get('domain-modeling')), true)
  })

  it('loads a body through the registry with frontmatter removed and whitespace trimmed', async () => {
    const grilling = await ctx.skills.get('grilling')
    assert.ok(grilling)
    assert.ok(grilling.content.startsWith('Interview the user relentlessly until you reach a shared understanding.'))
    assert.equal(grilling.content, grilling.content.trim())
    assert.equal(grilling.resourceBase.kind, 'directory')
  })

  it('keeps grill-with-docs loadable by name, since only its catalog entry is hidden', async () => {
    const grillWithDocs = await ctx.skills.get('grill-with-docs')
    assert.ok(grillWithDocs)
    assert.equal(grillWithDocs.content, 'Call the Skill tool twice, for "grilling" and "domain-modeling".')
  })

  it('reports an unknown skill name as unavailable', async () => {
    assert.equal(await ctx.skills.get('not-a-packaged-skill'), undefined)
  })
})
