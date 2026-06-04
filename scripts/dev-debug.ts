#!/usr/bin/env bun
/**
 * Terminal attach debugging (same process as F5 — no spawn):
 *   bun run dev:inspect
 * Then F5 → "Attach: manual (6499)" or use preLaunchTask configs.
 *
 * Override port/path: BUN_INSPECT=127.0.0.1:6499/test bun run dev:inspect
 */
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDevF5LaunchArgs } from './devArgs.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const inspect = process.env.BUN_INSPECT ?? '127.0.0.1:6499/test'
const extraArgs = process.argv.slice(2)

const args = [`--inspect-wait=${inspect}`, ...getDevF5LaunchArgs({ extraArgs })]

console.error(`\nBun inspector: ws://${inspect}`)
console.error('Cursor: F5 → ★ Attach REPL → query.ts (首选)\n')

const result = Bun.spawnSync([process.execPath, ...args], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: { ...process.env, NODE_ENV: 'production' },
})

process.exit(result.exitCode ?? 0)
