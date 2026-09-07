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
const modelSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/resourceCreation.model.ts',
  ),
  'utf8',
)

describe('resource creation safety wall', () => {
  it('keeps Unidad at contract-pending without a legacy attribute renderer', () => {
    const continuation = surfaceSource.match(
      /const goToAttributes = \(\) => \{[\s\S]*?\n\s+const backToContext/,
    )?.[0]

    expect(continuation).toContain("setStep('contract-pending')")
    expect(continuation).not.toContain('loadStep2')
    expect(surfaceSource).not.toContain('{step === 2 && (')
  })

  it('keeps legacy attribute draft mechanics out of the current reducer boundary', () => {
    expect(modelSource).not.toContain("kind: 'attribute'")
    expect(modelSource).not.toContain('attributeIds')
    expect(modelSource).not.toContain('attributeValues')
    expect(modelSource).not.toContain('omittedAttributeIds')
    expect(modelSource).not.toContain('SET_ATTRIBUTE_VALUE')
    expect(modelSource).not.toContain('OMIT_ATTRIBUTE')
  })
})
