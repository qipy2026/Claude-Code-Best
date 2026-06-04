/**
 * Shared dev-mode Bun CLI args (-d defines + --feature flags).
 * Used by dev.ts (terminal spawn) and generate-vscode-launch.ts (F5 same-process).
 */
import { getMacroDefines, DEFAULT_BUILD_FEATURES } from './defines.ts'

export function getDevDefineArgs(): string[] {
  const defines = {
    ...getMacroDefines(),
    // NODE_ENV is set via process.env (not -d) — VS Code js-debug breaks -d string defines.
  }
  return Object.entries(defines).flatMap(([k, v]) => ['-d', `${k}:${v}`])
}

export function getDevFeatureArgs(): string[] {
  const envFeatures = Object.entries(process.env)
    .filter(([k]) => k.startsWith('FEATURE_'))
    .map(([k]) => k.replace('FEATURE_', ''))
  const allFeatures = [...new Set([...DEFAULT_BUILD_FEATURES, ...envFeatures])]
  return allFeatures.flatMap(name => ['--feature', name])
}

/** Relative path to the same-process dev entry (for F5 — no spawn). */
export const DEV_CLI_ENTRY = 'scripts/dev-cli.ts'

/** Absolute-path cli.tsx entry (for terminal `bun run dev` spawn). */
export function getDevCliTsxPath(projectRoot: string): string {
  return `${projectRoot}/src/entrypoints/cli.tsx`.replace(/\\/g, '/')
}

/** F5 / Cursor: `bun --feature ... scripts/dev-cli.ts` — no `run`, no `-d`. */
export function getDevF5LaunchArgs(options?: {
  extraArgs?: string[]
}): string[] {
  return [...getDevFeatureArgs(), DEV_CLI_ENTRY, ...(options?.extraArgs ?? [])]
}

/** Terminal spawn: `bun run -d ... --feature ... src/entrypoints/cli.tsx` */
export function getDevBunRunArgs(options?: {
  entry?: string
  extraArgs?: string[]
}): string[] {
  const entry = options?.entry ?? DEV_CLI_ENTRY
  return [
    'run',
    ...getDevDefineArgs(),
    ...getDevFeatureArgs(),
    entry,
    ...(options?.extraArgs ?? []),
  ]
}

export const DEV_NODE_ENV = 'production'
