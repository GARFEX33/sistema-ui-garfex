import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'

export type ButtonVariant = 'accent' | 'outline'

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className'>,
    React.RefAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  className?: string
}

const base =
  'inline-flex min-h-[30px] cursor-pointer items-center gap-2.5 rounded border px-3.5 py-[5px] text-[13px] font-bold disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-text-muted [&_kbd]:text-[11px] [&_kbd]:font-semibold [&_kbd]:opacity-75'

const variants: Record<ButtonVariant, string> = {
  accent: 'border-primary bg-accent text-on-accent',
  outline: 'border-primary bg-transparent text-primary',
}

export function Button({
  variant = 'accent',
  className,
  ref,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      ref={ref}
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
