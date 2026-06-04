#!/usr/bin/env bun
/** F5 调试用：若不在此行暂停，说明调试器未正确 attach。 */
console.log('debug-smoke: before debugger')
// biome-ignore lint/suspicious/noDebugger: intentional F5 smoke test
debugger
console.log('debug-smoke: after debugger (should NOT print if debugger works)')
