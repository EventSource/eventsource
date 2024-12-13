import {copyFile, readdir, readFile, writeFile} from 'node:fs/promises'
import {join as joinPath} from 'node:path'

const referenceDirective = `/// <reference path="events.d.ts" />`

/**
 * Add a reference directive to the `events.d.ts` file at the top of every "type entry"
 * file in the `dist` (output) directory. These files are eg `index.d.ts` and `index.d.cts`.
 *
 * This is necessary because the `events.d.ts` file contains some "shims" for APIs such as
 * `Event`, `EventTarget` and `MessageEvent` that are technically part of the supported
 * environments, but not always present in their typings - eg `@types/node` does not declare
 * a global `MessageEvent` even though it is present in Node.js.
 *
 * Current build tooling (`@sanity/pkg-utils`) does not support adding reference directives
 * directly, so we have to do this as a post-build step.
 */
async function referenceEventTypings() {
  const distDir = joinPath(import.meta.dirname, '..', 'dist')
  const srcDir = joinPath(import.meta.dirname, '..', 'src')

  const entries = await readdir(distDir)

  const typeEntries = entries.filter(
    (entry) => entry.startsWith('index.') && (entry.endsWith('.d.ts') || entry.endsWith('.d.cts')),
  )

  for (const entry of typeEntries) {
    const typeFile = joinPath(distDir, entry)
    const typeFileContent = await readFile(typeFile, 'utf-8')

    if (!typeFileContent.includes(referenceDirective)) {
      await writeFile(typeFile, `${referenceDirective}\n\n${typeFileContent}`)
    }
  }

  await copyFile(joinPath(srcDir, 'events.d.ts'), joinPath(distDir, 'events.d.ts'))
}

referenceEventTypings().catch((error) => {
  console.error(error)
  process.exit(1)
})
