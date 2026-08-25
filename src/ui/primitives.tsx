import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'border-white/90 bg-white text-black hover:bg-zinc-200',
  secondary: 'border-white/[0.10] bg-white/[0.045] text-cs-text hover:bg-white/[0.08]',
  ghost: 'border-transparent bg-transparent text-cs-muted hover:bg-white/[0.055] hover:text-cs-text',
  danger: 'border-red-300/15 bg-red-300/[0.06] text-red-200 hover:bg-red-300/[0.10]',
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-8 px-3 text-xs',
  icon: 'size-7 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/55 disabled:pointer-events-none disabled:opacity-45',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: ButtonProps) {
  return <Button size="icon" variant="ghost" className={className} {...props} />;
}

const controlClass =
  'h-7 min-w-0 rounded-md border border-white/[0.10] bg-cs-surface px-2 text-[11px] text-cs-text outline-none transition-colors placeholder:text-cs-subtle focus:border-white/25 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, 'pr-7', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-w-0 rounded-md border border-white/[0.10] bg-cs-surface px-2.5 py-2 text-[11px] leading-5 text-cs-text outline-none transition-colors placeholder:text-cs-subtle focus:border-white/25 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-white/[0.075] bg-white/[0.025]', className)} {...props} />;
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('text-[9px] font-semibold uppercase tracking-[0.14em] text-cs-subtle', className)}
      {...props}
    />
  );
}

export function Muted({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-cs-muted', className)} {...props} />;
}
