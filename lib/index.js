/**
 * Packaged Matt Pocock skill provider for DeepSeek Harness.
 *
 * Ships `grill-with-docs`, `grilling` and `domain-modeling` as one packaged
 * skill provider, so the three skills reach the session catalog without a
 * local skill root. The packaged bundles are byte-identical to their upstream
 * `SKILL.md` files, and the frontmatter stays the single source of truth:
 * discovery parses it into catalog metadata, and every load re-reads the body,
 * so editing an asset needs no cache invalidation.
 *
 * Two upstream semantics are preserved deliberately:
 *
 * - `grill-with-docs` carries `disable-model-invocation: true`, so it maps to
 *   `modelInvocable: false`. The `/grill-with-docs` gesture is its only entry
 *   point, and the catalog and the `skill` tool never expose it.
 * - `grilling` and `domain-modeling` stay model-invocable, because
 *   `grill-with-docs` delegates to them at load time.
 *
 * @module dsh-skill-grill-with-docs
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUNDLED_SKILL_RANK, isSkillName } from '@deepseek-ai/dsh-skill'

/** Unique provider name in the `ctx.skills` registry. */
const PROVIDER_NAME = 'mattpocock-skills'
/** Origin bucket for packaged skill contributions. */
const SOURCE = 'bundled'
/** Packaged skill bundles, in catalog order. */
const BUNDLED_SKILL_DIRS = ['grill-with-docs', 'grilling', 'domain-modeling']
/** Root of the packaged skill resources. */
const ASSETS_DIR = fileURLToPath(new URL('../assets/', import.meta.url))

/** A leading `---` block, up to and including the closing delimiter's newline. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
/** Boolean spellings accepted by the filesystem provider, so both providers agree. */
const TRUE_SPELLINGS = new Set(['true', 'yes', 'on', '1'])
const FALSE_SPELLINGS = new Set(['false', 'no', 'off', '0'])

/**
 * Parse one flat `key: scalar` frontmatter block.
 * @param text - the complete `SKILL.md` contents.
 * @param file - absolute path, used for error messages.
 * @returns the parsed fields and the body after the frontmatter.
 */
function parseFrontmatter(text, file) {
  const match = FRONTMATTER.exec(text)
  if (!match) throw new Error(`${file}: packaged skill is missing its YAML frontmatter`)
  const fields = new Map()
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const separator = line.indexOf(':')
    if (separator === -1) {
      throw new Error(`${file}: unsupported frontmatter line ${JSON.stringify(line)}`)
    }
    let value = line.slice(separator + 1).trim()
    const quoted = value.length > 1
      && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    if (quoted) value = value.slice(1, -1)
    fields.set(line.slice(0, separator).trim(), value)
  }
  return { fields, body: text.slice(match[0].length) }
}

/**
 * Read a required non-empty frontmatter string.
 * @param fields - parsed frontmatter fields.
 * @param key - field to read.
 * @param file - absolute path, used for error messages.
 * @returns the field value.
 */
function requireText(fields, key, file) {
  const value = fields.get(key)
  if (value === undefined || value === '') {
    throw new Error(`${file}: frontmatter is missing a non-empty ${key}`)
  }
  return value
}

/**
 * Read an optional boolean frontmatter field.
 * @param fields - parsed frontmatter fields.
 * @param key - field to read.
 * @param file - absolute path, used for error messages.
 * @param fallback - value used when the field is absent.
 * @returns the resolved boolean.
 */
function readBoolean(fields, key, file, fallback) {
  const value = fields.get(key)
  if (value === undefined) return fallback
  const folded = value.toLowerCase()
  if (TRUE_SPELLINGS.has(folded)) return true
  if (FALSE_SPELLINGS.has(folded)) return false
  throw new Error(`${file}: ${key} must be a boolean, received ${JSON.stringify(value)}`)
}

/**
 * Read and validate one packaged skill bundle.
 * @param dir - bundle directory name under `assets/`, also the skill name.
 * @returns the parsed bundle, or `undefined` when the body file is absent.
 */
async function readBundledSkill(dir) {
  const file = join(ASSETS_DIR, dir, 'SKILL.md')
  let text
  try {
    text = await readFile(file, 'utf8')
  } catch (cause) {
    if (cause?.code === 'ENOENT') return undefined
    throw new Error(`cannot read packaged skill body ${file}`, { cause })
  }
  const { fields, body } = parseFrontmatter(text, file)
  const name = requireText(fields, 'name', file)
  if (!isSkillName(name)) {
    throw new Error(`${file}: ${JSON.stringify(name)} is not a kebab-case skill name`)
  }
  if (name !== dir) {
    throw new Error(
      `${file}: frontmatter name ${JSON.stringify(name)} does not match its directory ${JSON.stringify(dir)}`,
    )
  }
  return {
    name,
    description: requireText(fields, 'description', file),
    whenToUse: fields.get('whenToUse'),
    invocation: {
      modelInvocable: !readBoolean(fields, 'disable-model-invocation', file, false),
      userInvocable: readBoolean(fields, 'user-invocable', file, true),
    },
    body,
  }
}

/**
 * Build the invocation-neutral summary of a parsed bundle.
 * @param skill - a parsed bundle.
 * @returns the summary carrying the bundle's directory resource base.
 */
function toSummary(skill) {
  const summary = {
    name: skill.name,
    description: skill.description,
    invocation: skill.invocation,
    source: SOURCE,
    provider: PROVIDER_NAME,
    resourceBase: { kind: 'directory', path: join(ASSETS_DIR, skill.name) },
  }
  return skill.whenToUse === undefined ? summary : { ...summary, whenToUse: skill.whenToUse }
}

/**
 * Build the registry catalog entry for a parsed bundle.
 * @param skill - a parsed bundle.
 * @returns the candidate, whose locator is the bundle directory name.
 */
function toCandidate(skill) {
  return { ...toSummary(skill), rank: BUNDLED_SKILL_RANK, locator: skill.name }
}

/** Packaged provider contributing the three Matt Pocock skills. */
const provider = {
  name: PROVIDER_NAME,
  /**
   * List the packaged candidates.
   * A bundle body missing from the installed package fails the whole
   * observation rather than dropping one skill, so a broken install is
   * visible instead of indistinguishable from an absent skill.
   * @returns the three candidates.
   */
  async list() {
    const skills = await Promise.all(BUNDLED_SKILL_DIRS.map((dir) => readBundledSkill(dir)))
    const missing = BUNDLED_SKILL_DIRS.filter((_, index) => skills[index] === undefined)
    if (missing.length > 0) {
      throw new Error(
        `packaged skill bodies are missing from the installed package: ${missing.join(', ')}`,
      )
    }
    return skills.map((skill) => toCandidate(skill))
  },
  /**
   * Load one packaged skill body.
   * @param candidate - a candidate previously returned by {@link provider.list}.
   * @returns the definition, or `undefined` when the bundle is no longer loadable.
   */
  async get(candidate) {
    const dir = candidate.locator
    if (typeof dir !== 'string' || !BUNDLED_SKILL_DIRS.includes(dir)) return undefined
    const skill = await readBundledSkill(dir)
    if (skill === undefined) return undefined
    // `.trim()` matches the filesystem provider's body extraction, so a skill
    // renders identically whether it arrives from a local root or this package.
    return { ...toSummary(skill), content: skill.body.trim() }
  },
}

/** Cordis plugin name. */
const name = 'skill-grill-with-docs'
/** Service required by the packaged provider. */
const inject = ['skills']

/**
 * Register the packaged provider on `ctx.skills`.
 * @param ctx - the plugin context carrying the skill registry.
 */
function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
