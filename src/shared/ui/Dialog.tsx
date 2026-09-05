import type { ReactNode } from 'react'
import {
  Dialog as AriaDialog,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from 'react-aria-components'

export interface DialogProps
  extends Omit<AriaDialogProps, 'children' | 'className'>,
    React.RefAttributes<HTMLElement> {
  isOpen: boolean
  isDismissable?: boolean
  onOpenChange: (isOpen: boolean) => void
  width?: number
  /** Fixed dialog height in px. Omit to size to content (capped at viewport
   * height minus 32px) — the right default for variable-length content. Some
   * of Catálogo's approved dialogs are pixel-locked to a fixed height by the
   * OpenPencil design authority; pass it explicitly for those. */
  height?: number
  className?: string
  children: ReactNode
}

export function Dialog({
  isOpen,
  isDismissable = false,
  onOpenChange,
  width = 630,
  height,
  className,
  children,
  ref,
  ...dialogProps
}: DialogProps) {
  return (
    <ModalOverlay
      className="fixed inset-0 z-20 grid items-start justify-items-center bg-[rgb(31_31_29_/_42%)] pt-[140px]"
      isOpen={isOpen}
      isDismissable={isDismissable}
      onOpenChange={onOpenChange}
    >
      <Modal style={{ width, marginLeft: 30 }} className="box-border">
        <AriaDialog
          ref={ref}
          {...dialogProps}
          style={height === undefined ? undefined : { height }}
          className={[
            'box-border flex max-h-[calc(100vh-32px)] flex-col overflow-y-auto rounded-xl border border-primary bg-surface pt-[26px] pr-[27px] pb-[18px] pl-[27px] text-text-primary shadow-[0_18px_50px_rgb(31_31_29_/_25%)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  )
}

export function DialogHeading({
  title,
  hint = 'Esc cerrar',
}: {
  title: string
  hint?: string
}) {
  return (
    <header className="mb-4 flex flex-none items-baseline justify-between">
      <h2 className="m-0 text-[19px]">{title}</h2>
      <span className="text-[11px] font-semibold text-text-secondary">
        {hint}
      </span>
    </header>
  )
}

export function DialogContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  )
}

export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <footer className="sticky bottom-0 z-10 mt-auto flex flex-none items-center justify-between gap-3 bg-surface pt-3">
      {children}
    </footer>
  )
}
