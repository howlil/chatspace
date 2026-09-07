import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'icon';

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'border-cs-primary bg-cs-primary text-cs-primary-contrast hover:opacity-90',
  secondary: 'border-cs-border bg-cs-control text-cs-text hover:bg-cs-hover',
  ghost: 'border-transparent bg-transparent text-cs-muted hover:bg-cs-hover hover:text-cs-text',
  danger: 'border-red-400/20 bg-red-500/[0.08] text-cs-danger hover:bg-red-500/[0.14]',
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cs-focus/50 disabled:pointer-events-none disabled:opacity-45',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(function IconButton({ className, ...props }, ref) {
  return <Button ref={ref} size="icon" variant="ghost" className={className} {...props} />;
});

const controlClass = 'h-7 min-w-0 rounded-md border border-cs-border bg-cs-control px-2 text-[11px] text-cs-text outline-none transition-colors placeholder:text-cs-subtle focus:border-cs-focus focus:ring-1 focus:ring-cs-focus/20 disabled:cursor-not-allowed disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-w-0 rounded-md border border-cs-border bg-cs-control px-2.5 py-2 text-[11px] leading-5 text-cs-text outline-none transition-colors placeholder:text-cs-subtle focus:border-cs-focus focus:ring-1 focus:ring-cs-focus/20 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />;
});

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-[9px] font-semibold uppercase tracking-[0.14em] text-cs-subtle', className)} {...props} />;
}
