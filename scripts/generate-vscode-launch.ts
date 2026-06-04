#!/usr/bin/env bun
// biome-ignore-all lint/suspicious/noTemplateCurlyInString: VS Code ${workspaceFolder} placeholders in generated JSON
/**
 * Regenerate .vscode/launch.json + tasks.json — requires Bun for VS Code (oven.bun-vscode).
 *
 * Windows 上 launch 模式断点经常绑不上；首选 attach + --inspect-brk（preLaunchTask）。
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDevFeatureArgs } from './devArgs.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const vscodeDir = join(projectRoot, '.vscode')

const bunRuntime = '${env:USERPROFILE}\\.bun\\bin\\bun.exe'
const devCliProgram = '${workspaceFolder}/scripts/dev-cli.ts'
const smokeProgram = '${workspaceFolder}/scripts/debug-smoke.ts'

/** Bun inspector path segment (not full ws:// URL). */
const INSPECT_PATH = '127.0.0.1:6499/test'
const INSPECT_WS = `ws://${INSPECT_PATH}`

const featureArgs = getDevFeatureArgs()

const inspectBrkArg = `--inspect-brk=${INSPECT_PATH}`

function bunTaskArgs(extraProgramArgs: string[]): string[] {
  return [
    inspectBrkArg,
    ...featureArgs,
    'scripts/dev-cli.ts',
    ...extraProgramArgs,
  ]
}

const sharedEnv = { NODE_ENV: 'production' }

const attachBase = {
  type: 'bun' as const,
  request: 'attach' as const,
  url: INSPECT_WS,
  stopOnEntry: true,
}

const launchBase = {
  type: 'bun' as const,
  request: 'launch' as const,
  runtime: bunRuntime,
  runtimeArgs: ['--inspect-wait', ...featureArgs],
  program: devCliProgram,
  cwd: '${workspaceFolder}',
  env: sharedEnv,
  strictEnv: false,
  watchMode: false,
  stopOnEntry: true,
  noDebug: false,
}

const launch = {
  version: '0.2.0',
  configurations: [
    {
      ...attachBase,
      name: '★ Attach REPL → query.ts (首选)',
      preLaunchTask: 'bun: inspect-brk dev-cli (REPL)',
    },
    {
      ...attachBase,
      name: '★ Attach pipe (-p) → query.ts',
      preLaunchTask: 'bun: inspect-brk dev-cli (pipe)',
    },
    {
      ...attachBase,
      name: 'Attach: 手动 (先 bun run dev:inspect)',
    },
    {
      ...launchBase,
      name: 'Launch inspect-wait REPL',
    },
    {
      type: 'bun',
      request: 'launch',
      name: 'Smoke: debugger 是否工作',
      runtime: bunRuntime,
      runtimeArgs: ['--inspect-wait'],
      program: smokeProgram,
      cwd: '${workspaceFolder}',
      stopOnEntry: true,
      noDebug: false,
    },
    {
      type: 'bun',
      request: 'launch',
      name: 'Test: 当前测试文件',
      runtime: bunRuntime,
      program: '${file}',
      cwd: '${workspaceFolder}',
    },
  ],
}

function makeInspectTask(
  label: string,
  extraProgramArgs: string[],
): Record<string, unknown> {
  return {
    label,
    type: 'process',
    // type: process 绕过 PowerShell shell 包装，避免 Windows 上 -Command 解析错误
    command: bunRuntime,
    args: bunTaskArgs(extraProgramArgs),
    options: {
      cwd: '${workspaceFolder}',
      env: sharedEnv,
    },
    isBackground: true,
    presentation: {
      echo: true,
      reveal: 'always',
      focus: true,
      panel: 'dedicated',
      showReuseMessage: false,
    },
    problemMatcher: {
      owner: 'bun',
      pattern: { regexp: '^$', file: 1, location: 2, message: 3 },
      background: {
        activeOnStart: true,
        beginsPattern: 'Bun Inspector|Listening:',
        endsPattern: 'ws://127\\.0\\.0\\.1:6499/test',
      },
    },
  }
}

const tasks = {
  version: '2.0.0',
  tasks: [
    makeInspectTask('bun: inspect-brk dev-cli (REPL)', []),
    makeInspectTask('bun: inspect-brk dev-cli (pipe)', [
      '-p',
      '--model',
      'deepseek-v4-flash',
    ]),
  ],
}

const settings = {
  'bun.runtime': '${env:USERPROFILE}\\.bun\\bin\\bun.exe',
  'bun.debugTerminal.enabled': true,
  'bun.debugTerminal.stopOnEntry': false,
}

writeFileSync(
  join(vscodeDir, 'launch.json'),
  `${JSON.stringify(launch, null, 2)}\n`,
)
writeFileSync(
  join(vscodeDir, 'tasks.json'),
  `${JSON.stringify(tasks, null, 2)}\n`,
)
writeFileSync(
  join(vscodeDir, 'settings.json'),
  `${JSON.stringify(settings, null, 2)}\n`,
)
console.log('Wrote .vscode/launch.json, tasks.json, settings.json')
console.log(`Attach URL: ${INSPECT_WS}`)
console.log('F5 首选: ★ Attach REPL → query.ts (首选)')
