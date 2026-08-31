import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const forbidden = ['storybook/', 'storybook\\', '__GARFEX_PRESENTATION_FIXTURE_ONLY__', 'operationsInbox.fixtures']

if (!existsSync(dist)) {
  console.error('Runtime bundle verification failed: dist/ does not exist. Run pnpm build first.')
  process.exit(1)
}

const files = walk(dist)
const manifest = files.find((file) => file.endsWith('manifest.json'))
if (!manifest) {
  console.error('Runtime bundle verification failed: manifest.json does not exist.')
  process.exit(1)
}

const violations = []
for (const file of files) {
  const contents = readFileSync(file, 'utf8')
  for (const marker of forbidden) if (contents.includes(marker)) violations.push(`${file}: ${marker}`)
}

if (violations.length > 0) {
  console.error('Runtime bundle contains presentation fixture references:')
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`Runtime bundle verified: ${files.length} files inspected; presentation fixtures excluded.`)

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}
