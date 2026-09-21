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
const creationRuntimeFiles = [
  'CrearRecursoSurface.tsx',
  'CreationStageRail.tsx',
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

  // Slice C2d (replace-convex-with-rest-backend) intentionally retired the
  // "Creator stays blocked behind ResourceCreationContractPending" wall for
  // CrearRecursoSurface.tsx once G5 and G4's evaluation-blocking portion
  // stopped applying (see tasks.md's 2026-09-16 supersession note): the
  // surface now wires the real REST wizard. The assertions below were
  // updated to guard the boundaries that are still real — the legacy
  // Convex-era modules (`resourceCreation.model.ts`,
  // `useResourceCreationFlow.ts`, `ResourceCreationAttributesStage.tsx`,
  // `resourceCreation.attributeView.ts`) stay out of the wizard surface —
  // rather than assert the surface is still a static stub, which is no
  // longer true by design.
  it('keeps Entry ownership construction independent of the wizard surface', () => {
    expect(entrySource).toMatch(
      /const creationOwnership: ResourceCreationEvaluationOwnership\s*=\s*\{\s*kind: 'GLOBAL',?\s*\}/,
    )
    expect(entrySource).toContain(
      '<ResourcesMasterScreen creationOwnership={creationOwnership} />',
    )
    expect(surfaceSource).not.toMatch(
      /ResourcesMasterApi|ownership|useResourceCreationFlow/,
    )
  })

  it('keeps the wizard surface free of the legacy attribute-stage and view-projection modules', () => {
    expect(surfaceSource).not.toMatch(
      /ResourceCreationAttributesStage|resourceCreation\.attributeView/,
    )
  })

  it('keeps the direct Unit flow independent of the removed policy controller', () => {
    expect(loaderSource).not.toContain('createUnitPolicyPageController')
  })

  it('keeps the raw staged selector encapsulated inside its context boundary', () => {
    expect(surfaceSource).not.toMatch(/StagedSearchSelector/)
    expect(surfaceSource).toContain('ResourceCreationContextStage')
    expect(contextStageSource).toContain('<StagedSearchSelector')
    expect(contextStageSource).toContain('hidden={view.stage !==')
  })

  it('keeps wizard stage state in the reducer and legacy flow stages in their model boundary', () => {
    expect(surfaceSource).not.toMatch(
      /const \[step|railStageOverride|const \[classId|const \[familyId|const \[typeId|ResourceCreationAttributesStage|resourceCreation\.attributeView/,
    )
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
    // `attributeValues` is excluded from this guard: it is the wizard's own
    // (intentional, C2d-authorized) collected-attribute state passed to
    // ResourceCreationAttributeSequencer/ResourceCreationReview, not the
    // legacy Convex-era pattern this test otherwise guards against.
    expect(surfaceSource).not.toMatch(
      /api\.createResource|buildValores|AttributeField|resource-nombre|resource-descripcion|Nombre \*|Descripción|SubmitStatus|submitStatus|submitError|UNCERTAIN_MESSAGE|ADMIN_ERROR_MESSAGES|extractAdminCode|backToAttributes|ownership: \{ kind:|valores: buildValores|Crear recurso|step === 3/,
    )
  })
})
