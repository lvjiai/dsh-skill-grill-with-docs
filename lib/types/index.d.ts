/**
 * Packaged Matt Pocock skill provider.
 *
 * @module dsh-skill-grill-with-docs
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. */
export declare const name = "skill-grill-with-docs";
/** Service required by the packaged provider. */
export declare const inject: string[];
/** Register the packaged provider on `ctx.skills`. */
export declare function apply(ctx: Context): void;
