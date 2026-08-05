import {resolve, join} from 'node:path'
import {rm} from 'node:fs/promises'

const BASE_DIR = resolve(import.meta.dirname, '..')
const options = {recursive: true, force: true}

await rm(join(BASE_DIR, 'dist'), options)
await rm(join(BASE_DIR, 'coverage'), options)
