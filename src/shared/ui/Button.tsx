import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'

export type ButtonVariant = 'accent' | 'outline' | 'quiet'

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className'>,
    React.RefAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  className?: string
}

const base =
  'inline-flex cursor-pointer items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-text-muted [&_kbd]:text-[11px] [&_kbd]:font-semibold [&_kbd]:opacity-75'
const standard =
  'min-h-[30px] gap-2.5 border px-3.5 py-[5px] text-[13px] font-bold'

const variants: Record<ButtonVariant, string> = {
  accent: `${standard} border-primary bg-accent text-on-accent`,
  outline: `${standard} border-primary bg-transparent text-primary`,
  quiet:
    'min-h-0 gap-1.5 border-transparent px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-subtle hover:text-primary active:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-primary-subtle aria-pressed:text-primary',
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
