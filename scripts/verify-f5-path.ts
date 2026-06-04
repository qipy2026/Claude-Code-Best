#!/usr/bin/env bun
/** Verify F5 path: bun --feature ... scripts/dev-cli.ts -p (same process as launch.json) */
import { getDevF5LaunchArgs } from './devArgs.ts'

const args = getDevF5LaunchArgs({
  extraArgs: ['-p', '--model', 'deepseek-v4-flash'],
})
const input = 'Reply with exactly: BREAKPOINT_PATH_OK\n'
const proc = Bun.spawnSync([process.execPath, ...args], {
  stdin: new Blob([input]),
  stdout: 'pipe',
  stderr: 'pipe',
  cwd: import.meta.dir + '/..',
  env: { ...process.env, NODE_ENV: 'production' },
})
const out = proc.stdout.toString()
const err = proc.stderr.toString()
if (proc.exitCode !== 0) {
  console.error('FAIL exit', proc.exitCode)
  console.error(err)
  process.exit(1)
}
if (!out.includes('BREAKPOINT_PATH_OK')) {
  console.error('FAIL output:', out.slice(0, 500))
  if (err) console.error(err.slice(0, 500))
  process.exit(1)
}
console.log('OK: F5 same-process path works (dev-cli.ts, no -d flags)')
