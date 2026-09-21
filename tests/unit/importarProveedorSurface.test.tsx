import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImportarProveedorSurface } from '../../src/features/proveedores/ImportarProveedorSurface'

const file = new File(['<cfdi/>'], 'factura.xml', { type: 'application/xml' })

const selectFile = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Importar desde XML' }))
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await user.upload(input, file)
}

describe('ImportarProveedorSurface', () => {
  it('shows a loading status while the CFDI XML is being read', async () => {
    const user = userEvent.setup()
    let resolvePreview: (value: unknown) => void = () => {}
    const previewSupplierFromCfdi = vi.fn(
      () => new Promise((resolve) => (resolvePreview = resolve)),
    )
    render(
      <ImportarProveedorSurface
        previewSupplierFromCfdi={previewSupplierFromCfdi}
        createSupplier={vi.fn()}
        updateSupplier={vi.fn()}
      />,
    )

    await selectFile(user)
    expect(screen.getByRole('status')).toHaveTextContent('Leyendo el archivo…')
    resolvePreview({
      draft: { taxIdentifier: '', legalName: '', taxRegime: '' },
      existing: null,
    })
  })

  it('prefills a create form with the CFDI draft when the RFC is new', async () => {
    const user = userEvent.setup()
    const previewSupplierFromCfdi = vi.fn().mockResolvedValue({
      draft: {
        taxIdentifier: 'CDN010203ABC',
        legalName: 'Cables del Norte S.A. de C.V.',
        taxRegime: '601',
      },
      existing: null,
    })
    const createSupplier = vi.fn().mockResolvedValue({ id: 's1' })
    const onImported = vi.fn().mockResolvedValue(undefined)
    render(
      <ImportarProveedorSurface
        previewSupplierFromCfdi={previewSupplierFromCfdi}
        createSupplier={createSupplier}
        updateSupplier={vi.fn()}
        onImported={onImported}
      />,
    )

    await selectFile(user)
    expect(await screen.findByLabelText('Identificador fiscal')).toHaveValue(
      'CDN010203ABC',
    )
    expect(screen.getByLabelText('Razón social')).toHaveValue(
      'Cables del Norte S.A. de C.V.',
    )

    await user.click(screen.getByRole('button', { name: 'Crear proveedor' }))

    await waitFor(() =>
      expect(createSupplier).toHaveBeenCalledWith({
        tradeName: '',
        legalName: 'Cables del Norte S.A. de C.V.',
        taxIdentifier: 'CDN010203ABC',
        website: '',
        notes: '',
      }),
    )
    await waitFor(() => expect(onImported).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('indicates the RFC already belongs to a supplier and updates it on confirm', async () => {
    const user = userEvent.setup()
    const existing = {
      id: 'supplier-1',
      tradeName: 'Cables del Norte',
      legalName: 'Cables del Norte S.A.',
      taxIdentifier: 'OLDID',
      website: 'https://old.example',
      notes: 'nota vieja',
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    const previewSupplierFromCfdi = vi.fn().mockResolvedValue({
      draft: {
        taxIdentifier: 'CDN010203ABC',
        legalName: 'Cables del Norte S.A. de C.V.',
        taxRegime: '601',
      },
      existing,
    })
    const updateSupplier = vi.fn().mockResolvedValue({ ...existing })
    const onImported = vi.fn().mockResolvedValue(undefined)
    render(
      <ImportarProveedorSurface
        previewSupplierFromCfdi={previewSupplierFromCfdi}
        createSupplier={vi.fn()}
        updateSupplier={updateSupplier}
        onImported={onImported}
      />,
    )

    await selectFile(user)
    expect(
      await screen.findByText(
        /Ya existe un proveedor con este identificador fiscal/,
      ),
    ).toBeVisible()
    expect(screen.getByText('Cables del Norte')).toBeVisible()

    await user.click(
      screen.getByRole('button', { name: 'Actualizar proveedor' }),
    )

    await waitFor(() =>
      expect(updateSupplier).toHaveBeenCalledWith({
        id: 'supplier-1',
        tradeName: 'Cables del Norte',
        legalName: 'Cables del Norte S.A. de C.V.',
        taxIdentifier: 'CDN010203ABC',
        website: 'https://old.example',
        notes: 'nota vieja',
      }),
    )
    await waitFor(() => expect(onImported).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('shows an error when the file is not a usable CFDI', async () => {
    const user = userEvent.setup()
    const previewSupplierFromCfdi = vi
      .fn()
      .mockRejectedValue(new Error('NOT_CFDI'))
    render(
      <ImportarProveedorSurface
        previewSupplierFromCfdi={previewSupplierFromCfdi}
        createSupplier={vi.fn()}
        updateSupplier={vi.fn()}
      />,
    )

    await selectFile(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('NOT_CFDI')
  })
})
