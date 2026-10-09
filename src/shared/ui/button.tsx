import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'blue' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-amber text-ink hover:bg-amber-dark font-semibold',
  blue: 'bg-blue text-white hover:bg-blue-dark font-semibold',
  outline: 'border border-steel bg-surface text-ink hover:border-ink-mute',
  ghost: 'text-ink-soft hover:bg-steel-light hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95 font-semibold',
  link: 'text-blue underline-offset-4 hover:underline px-0',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-[10px] gap-2',
  lg: 'h-13 px-6 text-base rounded-xl gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'outline', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/** Ссылка, выглядящая как кнопка */
export const buttonClass = (variant: Variant = 'outline', size: Size = 'md', className?: string) =>
  cn('inline-flex items-center justify-center whitespace-nowrap transition-colors', variants[variant], sizes[size], className);
