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
const flowSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/useResourceCreationFlow.ts',
  ),
  'utf8',
)
const selectorStateSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/resourceCreation.selectorState.ts',
  ),
  'utf8',
)
const creationRuntimeFiles = [
  'CrearRecursoSurface.tsx',
  'CreationStageRail.tsx',
  'ResourceCreationContractPending.tsx',
  'ResourceCreationShell.tsx',
  'StagedSearchSelector.tsx',
  'resourceCreation.attributeSequence.ts',
  'resourceCreation.dependentLoader.ts',
  'resourceCreation.evaluationLease.ts',
  'resourceCreation.evaluationRequest.ts',
  'resourceCreation.loaders.ts',
  'resourceCreation.model.ts',
  'resourceCreation.selectionDraft.ts',
  'resourceCreation.selectorState.ts',
  'useResourceCreationEvaluation.ts',
  'useResourceCreationFlow.ts',
]
const creationRuntimeSources = creationRuntimeFiles.map((file) =>
  readFileSync(
    resolve(process.cwd(), 'src/features/resources-master', file),
    'utf8',
  ),
)

describe('resource creation safety wall', () => {
  it('keeps creation runtime modules bounded and free of legacy or global keyboard ownership', () => {
    creationRuntimeSources.forEach((source) => {
      expect(source.split('\n').length).toBeLessThan(500)
      expect(source).not.toMatch(
        /createResource|ResourceCreateInput|buildResourceCreateInput|(?:document|window)\.addEventListener\(['"]key/,
      )
    })
  })

  it('integrates one ownership-aware evaluation driver through the flow', () => {
    expect(surfaceSource).toContain('useResourceCreationFlow(api, ownership)')
    expect(flowSource.match(/useResourceCreationEvaluation\(\{/g)).toHaveLength(
      1,
    )
    expect(flowSource).toContain('evaluation: {')
    expect(flowSource).toContain('status: evaluation.status')
    expect(flowSource).toContain('retry: evaluation.retry')
  })

  it('keeps selector-state mapping and controller subscription behind the local flow boundary', () => {
    expect(flowSource).toContain("} from './resourceCreation.selectorState'")
    expect(flowSource).not.toContain('const selectorLoadState')
    expect(flowSource).not.toContain('const unitSelectorLoadState')
    expect(flowSource).not.toContain('const useControllerState')
    expect(selectorStateSource).toContain('export const selectorLoadState')
    expect(selectorStateSource).toContain('export const unitSelectorLoadState')
    expect(selectorStateSource).toContain('export const useControllerState')
  })

  it('keeps Unidad at contract-pending without a legacy attribute renderer', () => {
    const continuation = surfaceSource.match(
      /const confirmUnit = \([\s\S]*?\n\s+const currentRailStage/,
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

  it('keeps legacy manual-data and submit reducer protocol out of the model', () => {
    expect(modelSource).not.toContain("kind: 'resource-data'")
    expect(modelSource).not.toContain("kind: 'review'")
    expect(modelSource).not.toContain("kind: 'result'")
    expect(modelSource).not.toContain('SubmitState')
    expect(modelSource).not.toContain('SET_RESOURCE_DATA')
    expect(modelSource).not.toContain('SUBMIT_STARTED')
    expect(modelSource).not.toContain('isResourceDataValid')
    expect(modelSource).not.toContain('canSubmitResourceCreation')
  })

  it('does not retain the legacy created-result presentation or restart action', () => {
    expect(surfaceSource).not.toContain('✓ Recurso creado')
    expect(surfaceSource).not.toContain('Crear otro')
    expect(surfaceSource).not.toContain("submitStatus === 'created'")
    expect(surfaceSource).not.toContain('setCreated')
  })

  it('keeps legacy review, payload, and create mechanics out of the production surface', () => {
    expect(surfaceSource).not.toMatch(
      /api\.createResource|buildValores|AttributeField|attributeValues|resource-nombre|resource-descripcion|Nombre \*|Descripción|SubmitStatus|submitStatus|submitError|UNCERTAIN_MESSAGE|ADMIN_ERROR_MESSAGES|extractAdminCode|backToAttributes|ownership: \{ kind:|valores: buildValores|Crear recurso|step === 3/,
    )
  })
})
