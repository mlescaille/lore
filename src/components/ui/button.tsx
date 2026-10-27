import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn.ts'

type Variant = 'primary' | 'ghost' | 'paper' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary: 'btn btn-primary',
  ghost: 'btn btn-ghost',
  paper: 'btn btn-paper',
  quiet: 'btn btn-quiet',
}

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = cn(variantClass[variant], sizeClass[size], className)
  if (asChild) return <Slot className={classes} {...props} />
  return <button type={type} className={classes} {...props} />
}
