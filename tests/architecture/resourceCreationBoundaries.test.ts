import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const surfaceSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/CrearRecursoSurface.tsx',
  ),
  'utf8',
)

describe('resource creation safety wall', () => {
  it('keeps the Unidad continuation on the contract-pending boundary', () => {
    const continuation = surfaceSource.match(
      /const goToAttributes = \(\) => \{[\s\S]*?\n\s+const backToContext/,
    )?.[0]

    expect(continuation).toContain("setStep('contract-pending')")
    expect(continuation).not.toContain('loadStep2')
  })
})
