import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn.ts'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vermillion active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-vermillion text-ink hover:brightness-105',
        ghost: 'border border-white/15 bg-transparent text-paper hover:bg-white/5',
        paper: 'bg-paper text-ink hover:bg-white',
        quiet: 'bg-transparent text-paper/80 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-5 text-base',
        lg: 'h-14 px-6 text-[1.05rem]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, type = 'button', ...props }: ButtonProps) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
