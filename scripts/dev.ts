#!/usr/bin/env bun
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDevBunRunArgs, getDevCliTsxPath, DEV_NODE_ENV } from './devArgs.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const cliPath = getDevCliTsxPath(projectRoot)

const inspectArgs = process.env.BUN_INSPECT
  ? ['--inspect-wait=' + process.env.BUN_INSPECT]
  : []

const bunExecutable = process.execPath

const result = Bun.spawnSync(
  [
    bunExecutable,
    ...inspectArgs,
    ...getDevBunRunArgs({
      entry: cliPath,
      extraArgs: process.argv.slice(2),
    }),
  ],
  {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: DEV_NODE_ENV },
  },
)

process.exit(result.exitCode ?? 0)
