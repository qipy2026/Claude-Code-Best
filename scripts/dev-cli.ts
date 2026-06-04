#!/usr/bin/env bun
/**
 * Same-process dev entry for Cursor/VS Code F5 debugging.
 *
 * Launched as:
 *   bun --feature BUDDY --feature ... scripts/dev-cli.ts [cli args]
 *
 * No `bun run`, no `-d` flags (VS Code js-debug mangles those → production crash).
 * MACRO + NODE_ENV are applied here before loading the CLI.
 */
import { getMacroDefines } from './defines.ts'

process.env.NODE_ENV ??= 'production'

type MacroRuntime = {
  VERSION: string
  BUILD_TIME: string
  FEEDBACK_CHANNEL: string
  ISSUES_EXPLAINER: string
  NATIVE_PACKAGE_URL: string
  PACKAGE_URL: string
  VERSION_CHANGELOG: string
}

const macroHost = globalThis as unknown as { MACRO?: MacroRuntime }

if (macroHost.MACRO === undefined) {
  const d = getMacroDefines()
  macroHost.MACRO = {
    VERSION: JSON.parse(d['MACRO.VERSION']!),
    BUILD_TIME: JSON.parse(d['MACRO.BUILD_TIME']!),
    FEEDBACK_CHANNEL: JSON.parse(d['MACRO.FEEDBACK_CHANNEL']!),
    ISSUES_EXPLAINER: JSON.parse(d['MACRO.ISSUES_EXPLAINER']!),
    NATIVE_PACKAGE_URL: JSON.parse(d['MACRO.NATIVE_PACKAGE_URL']!),
    PACKAGE_URL: JSON.parse(d['MACRO.PACKAGE_URL']!),
    VERSION_CHANGELOG: JSON.parse(d['MACRO.VERSION_CHANGELOG']!),
  }
}

await import('../src/entrypoints/cli.tsx')
