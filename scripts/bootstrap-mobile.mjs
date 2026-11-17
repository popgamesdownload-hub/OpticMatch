#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = new Set(process.argv.slice(2))
const targetArg = process.argv.find((value) => value.startsWith('--project-dir='))
const target = resolve(targetArg?.split('=')[1] || './data/mobile-app')
const approved = args.has('--approve-install')
const allowNetwork = args.has('--allow-network')
const allowStorage = args.has('--allow-storage')

const actions = [
  `create an isolated Expo app at ${target}`,
  'install the project-local JavaScript dependencies',
  'write a runtime manifest for the QR / Metro handoff',
]

console.log('\nOpticMatch local runtime plan\n')
actions.forEach((action, index) => console.log(`  ${index + 1}. ${action}`))
console.log('\nNothing is installed unless all three consent flags are present:')
console.log('  --approve-install  --allow-network  --allow-storage\n')

if (!approved || !allowNetwork || !allowStorage) {
  console.log('Dry run only. Review the plan above, then rerun with explicit consent.')
  process.exit(0)
}

if (existsSync(join(target, 'package.json'))) {
  console.error(`\nRefusing to overwrite an existing app at ${target}. Choose another --project-dir.`)
  process.exit(1)
}

mkdirSync(resolve(target, '..'), { recursive: true })
const result = spawnSync('npx', ['create-expo-app@latest', target, '--template', 'tabs', '--yes'], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)

writeFileSync(join(target, '.opticmatch-runtime.json'), JSON.stringify({
  app: 'opticmatch',
  framework: 'expo-router',
  preview: 'expo-go-qr',
  createdAt: new Date().toISOString(),
  permissions: { network: true, storage: true },
}, null, 2) + '\n')

console.log(`\nWorkspace ready at ${target}`)
console.log('Next: install Expo Go, start Metro with `pnpm start`, and scan the QR code.')
