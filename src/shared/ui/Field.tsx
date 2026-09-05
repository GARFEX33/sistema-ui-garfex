import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  htmlFor: string
  hideLabel?: boolean
  emphasis?: boolean
  children: ReactNode
}

export function Field({ label, htmlFor, hideLabel, emphasis, children }: FieldProps) {
  return (
    <div
      className={
        emphasis
          ? 'grid content-start gap-4 pt-[11px] focus-within:[&_input]:border-accent focus-within:[&_input]:bg-[#fff7d6] focus-within:[&_input]:shadow-[0_0_0_2px_var(--color-primary)] focus-within:[&_input]:outline focus-within:[&_input]:outline-2 focus-within:[&_input]:-outline-offset-2 focus-within:[&_input]:outline-accent'
          : 'grid content-start gap-[7px] py-2'
      }
    >
      <label
        htmlFor={htmlFor}
        className={
          hideLabel
            ? 'sr-only'
            : 'text-[11px] font-bold tracking-[0.08em] text-text-primary'
        }
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function FieldSeparator() {
  return <div className="h-px bg-border" />
}
