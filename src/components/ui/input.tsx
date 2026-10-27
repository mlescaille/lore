import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn.ts'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field', className)} {...props} />
}
