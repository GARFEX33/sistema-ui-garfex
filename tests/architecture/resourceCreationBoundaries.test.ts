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
const contextStageSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/ResourceCreationContextStage.tsx',
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
const loaderSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/resourceCreation.loaders.ts',
  ),
  'utf8',
)
const entrySource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/ResourcesMasterEntry.tsx',
  ),
  'utf8',
)
const attributeViewSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/resourceCreation.attributeView.ts',
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
const createDriverSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/resources-master/useResourceCreationCreate.ts',
  ),
  'utf8',
)
const creationRuntimeFiles = [
  'CrearRecursoSurface.tsx',
  'CreationStageRail.tsx',
  'ResourceCreationContractPending.tsx',
  'ResourceCreationReview.tsx',
  'ResourceCreationShell.tsx',
  'ResourceCreationContextStage.tsx',
  'StagedSearchSelector.tsx',
  'resourceCreation.attributeSequence.ts',
  'resourceCreation.attributeStep.ts',
  'resourceCreation.attributeView.ts',
  'resourceCreation.createLease.ts',
  'resourceCreation.dependentLoader.ts',
  'resourceCreation.evaluationLease.ts',
  'resourceCreation.evaluationRequest.ts',
  'resourceCreation.loaders.ts',
  'resourceCreation.model.ts',
  'resourceCreation.selectionDraft.ts',
  'resourceCreation.selectorState.ts',
  'useResourceCreationAllowedValues.ts',
  'useResourceCreationAttributeDefinition.ts',
  'useResourceCreationAttributeQueries.ts',
  'useResourceCreationCreate.ts',
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
        /createResource(?!FromSelections)|ResourceCreateInput|buildResourceCreateInput|(?:document|window)\.addEventListener\(['"]key/,
      )
    })
  })

  it('allows the sole creation mutation driver without legacy creation types', () => {
    expect(createDriverSource.split('\n').length).toBeLessThan(500)
    expect(createDriverSource).toContain('useMutation')
    expect(createDriverSource).toContain('createResourceFromSelections')
    expect(createDriverSource).not.toMatch(
      /createResource(?!FromSelections)|ResourceCreateInput|onCreated/,
    )
  })

  it('keeps Entry ownership outside the directly blocked Creator surface', () => {
    expect(entrySource).toMatch(
      /const creationOwnership: ResourceCreationEvaluationOwnership\s*=\s*\{\s*kind: 'GLOBAL',?\s*\}/,
    )
    expect(entrySource).toContain(
      '<ResourcesMasterScreen creationOwnership={creationOwnership} />',
    )
    expect(surfaceSource).toContain('<ResourceCreationContractPending />')
    expect(surfaceSource).not.toMatch(
      /ResourcesMasterApi|ownership|useResourceCreationFlow/,
    )
  })

  it('keeps the blocked Creator free of flow, evaluation, attribute, and creation transport', () => {
    expect(surfaceSource).not.toMatch(
      /useResourceCreation|ResourceCreationContextStage|ResourceCreationAttributesStage|ResourceCreationReview|resourceCreation\.attributeView/,
    )
    expect(flowSource.match(/useResourceCreationEvaluation\(\{/g)).toHaveLength(
      1,
    )
    expect(flowSource.match(/useResourceCreationCreate\(\{/g)).toHaveLength(1)
    expect(flowSource).toContain('useResourceCreationAttributeQueries({')
    expect(flowSource).not.toContain('api.createResourceFromSelections')
  })

  it('keeps the definition driver bounded to current definitions', () => {
    const definitionDriverSource = readFileSync(
      resolve(
        process.cwd(),
        'src/features/resources-master/useResourceCreationAttributeDefinition.ts',
      ),
      'utf8',
    )

    expect(definitionDriverSource).toContain('getAttributeDefinition')
    expect(definitionDriverSource).not.toContain('listAllowedAttributeValues')
  })

  it('keeps the direct Unit flow independent of the removed policy controller', () => {
    expect(flowSource).not.toContain('createUnitPolicyPageController')
    expect(loaderSource).not.toContain('createUnitPolicyPageController')
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

  it('keeps staged selector wiring out of the blocked surface and inside its context boundary', () => {
    expect(surfaceSource).not.toMatch(
      /ResourceCreationContextStage|StagedSearchSelector/,
    )
    expect(contextStageSource).toContain('<StagedSearchSelector')
    expect(contextStageSource).toContain('hidden={flow.state.stage.kind !==')
  })

  it('keeps blocked-surface state local and leaves flow stages in their model boundary', () => {
    expect(surfaceSource).not.toMatch(
      /const \[step|railStageOverride|const \[classId|const \[familyId|const \[typeId|ResourceCreationAttributesStage|resourceCreation\.attributeView/,
    )
    expect(surfaceSource).toContain('<ResourceCreationContractPending />')
    expect(modelSource).not.toContain("kind: 'contract-pending'")
    expect(modelSource).toContain("kind: 'attributes'")
    expect(modelSource).toContain("kind: 'review-pending'")
  })

  it('keeps attribute view projection transport-free and independent of query hooks', () => {
    expect(attributeViewSource).not.toMatch(
      /api\.|useQuery|useResourceCreation|issues|valoresNormalizados/,
    )
  })

  it('keeps the review presenter transport-free and free of raw evaluation internals', () => {
    const reviewSource = readFileSync(
      resolve(
        process.cwd(),
        'src/features/resources-master/ResourceCreationReview.tsx',
      ),
      'utf8',
    )

    expect(reviewSource).not.toMatch(
      /api\.|useQuery|useMutation|asignacionAtributoId|definicionAtributoId|selectedValueId|valoresNormalizados|opcionAtributoId/,
    )
  })

  it('keeps current-attribute derivation transport-free and sequence-owned', () => {
    const attributeStepSource = readFileSync(
      resolve(
        process.cwd(),
        'src/features/resources-master/resourceCreation.attributeStep.ts',
      ),
      'utf8',
    )

    expect(attributeStepSource).toContain('deriveAttributeSequence')
    expect(attributeStepSource).not.toMatch(
      /api\.|useQuery|listAllowedAttributeValues|getAttributeDefinition|orden\.sort/,
    )
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
