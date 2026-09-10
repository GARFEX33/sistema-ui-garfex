import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { expect, test } from 'vitest'

type Item = { id: string; revision: number }
const connectedTest =
  process.env.RUN_CONNECTED_CATALOG_TESTS === 'true' ? test : test.skip
const url = 'http://127.0.0.1:3210'

const reference = <Kind extends 'query' | 'mutation'>(name: string) =>
  makeFunctionReference<Kind, Record<string, unknown>, unknown>(name)

const token = () => `f6${Date.now()}${Math.random().toString(36).slice(2, 7)}`

connectedTest(
  'persists an active no-policy Metro Lineal unit without policy writes',
  async () => {
    const client = new ConvexHttpClient(url)
    const query = (name: string, args: Record<string, unknown>) =>
      client.query(reference<'query'>(name), args)
    const mutation = (name: string, args: Record<string, unknown>) =>
      client.mutation(reference<'mutation'>(name), args)
    const create = async (name: string, args: Record<string, unknown>) =>
      ((await mutation(name, args)) as { item: Item }).item
    const suffix = token()
    const cleanup: Array<readonly [string, string, Item]> = []
    let resource: Item | undefined

    try {
      const clase = await create('catalogoAdmin/jerarquia:crearClase', {
        clave: `F6C${suffix}`,
        nombre: 'F6 Clase',
        activo: true,
      })
      const familia = await create('catalogoAdmin/jerarquia:crearFamilia', {
        claseRecursoId: clase.id,
        clave: `F6F${suffix}`,
        nombre: 'F6 Familia',
        activo: true,
      })
      const tipo = await create('catalogoAdmin/jerarquia:crearTipo', {
        familiaRecursoId: familia.id,
        clave: `F6T${suffix}`,
        nombre: 'F6 Tipo',
        activo: true,
      })
      const definicion = await create(
        'catalogoAdmin/atributos:crearDefinicionAtributo',
        {
          clave: `F6A${suffix}`,
          nombre: 'F6 Atributo',
          tipoDato: 'TEXTO',
          modoCaptura: 'LIBRE',
          activo: true,
        },
      )
      const asignacion = await create(
        'catalogoAdmin/atributos:crearAsignacionAtributo',
        {
          familiaRecursoId: familia.id,
          tipoRecursoId: tipo.id,
          definicionAtributoId: definicion.id,
          aplicabilidad: 'OPTIONAL',
          participaIdentidad: false,
          orden: 1,
          activo: true,
        },
      )
      const presentacion = await create(
        'catalogoAdmin/presentacion:crearPoliticaPresentacion',
        {
          tipoRecursoId: tipo.id,
          tokens: [{ tipo: 'TYPE_NAME' }],
          separador: '-',
          activo: true,
        },
      )
      const unidad = await create('catalogoAdmin/unidades:crearUnidad', {
        clave: `F6U${suffix}`,
        nombre: 'Metro Lineal',
        simbolo: 'm',
        activo: true,
      })
      cleanup.push(
        [
          'catalogoAdmin/atributos:desactivarAsignacionAtributo',
          'atributoRecursoId',
          asignacion,
        ],
        [
          'catalogoAdmin/atributos:desactivarDefinicionAtributo',
          'definicionAtributoId',
          definicion,
        ],
        ['catalogoAdmin/unidades:desactivarUnidad', 'unidadId', unidad],
        ['catalogoAdmin/jerarquia:desactivarTipo', 'tipoRecursoId', tipo],
        [
          'catalogoAdmin/presentacion:desactivarPoliticaPresentacion',
          'politicaPresentacionId',
          presentacion,
        ],
        [
          'catalogoAdmin/jerarquia:desactivarFamilia',
          'familiaRecursoId',
          familia,
        ],
        ['catalogoAdmin/jerarquia:desactivarClase', 'claseRecursoId', clase],
      )

      const before = (await query(
        'catalogoAdmin/unidades:listarPoliticasUnidad',
        {
          familiaRecursoId: familia.id,
          cursor: null,
          pageSize: 20,
          modo: 'ALL',
        },
      )) as { items: unknown[] }
      expect(before.items).toEqual([])

      const evaluation = (await query(
        'catalogoAdmin/recursos:evaluarCreacionDesdeSelecciones',
        {
          claseRecursoId: clase.id,
          familiaRecursoId: familia.id,
          tipoRecursoId: tipo.id,
          unidadId: unidad.id,
          selecciones: [],
          ownership: { kind: 'GLOBAL' },
        },
      )) as { status: string; valid: boolean; catalogFingerprint: string }
      expect(evaluation).toMatchObject({ status: 'VALID', valid: true })

      const created = (await mutation(
        'catalogoAdmin/recursos:crearRecursoDesdeSelecciones',
        {
          claseRecursoId: clase.id,
          familiaRecursoId: familia.id,
          tipoRecursoId: tipo.id,
          unidadId: unidad.id,
          expectedCatalogFingerprint: evaluation.catalogFingerprint,
          selecciones: [],
          ownership: { kind: 'GLOBAL' },
        },
      )) as { disposition: string; item: Item }
      expect(created.disposition).toBe('CREATED')
      resource = created.item

      const persisted = (await query(
        'catalogoAdmin/recursos:obtenerDetalleRecurso',
        { recursoId: resource.id },
      )) as { id: string; unidadId: string } | null
      expect(persisted).toEqual(
        expect.objectContaining({ id: resource.id, unidadId: unidad.id }),
      )
      const after = await query(
        'catalogoAdmin/unidades:listarPoliticasUnidad',
        {
          familiaRecursoId: familia.id,
          cursor: null,
          pageSize: 20,
          modo: 'ALL',
        },
      )
      expect(after).toEqual(before)
    } finally {
      if (resource)
        await mutation('catalogoAdmin/recursos:desactivarRecurso', {
          recursoId: resource.id,
          expectedRevision: resource.revision,
        })
      for (const [operation, idName, item] of cleanup)
        await mutation(operation, {
          [idName]: item.id,
          expectedRevision: item.revision,
        })
    }
  },
)
