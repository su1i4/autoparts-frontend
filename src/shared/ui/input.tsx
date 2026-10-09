import {
  cloneElement,
  forwardRef,
  InputHTMLAttributes,
  isValidElement,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
} from 'react';
import { cn } from '@/shared/lib/cn';

const base =
  'w-full rounded-[10px] border border-steel bg-surface px-3 text-[15px] text-ink placeholder:text-ink-mute transition-colors focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 disabled:bg-steel-light aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(base, 'h-11', className)} {...p} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cn(base, 'min-h-24 py-2.5', className)} {...p} />,
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...p }, ref) => (
    <select ref={ref} className={cn(base, 'h-11 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a8796' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...p}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

/**
 * Подпись + поле. Если внутри один элемент управления — Field сам связывает label/hint/error
 * с ним (id, aria-describedby, aria-invalid), чтобы подписи читались скринридерами.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  const auto = useId();
  const single = isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const id = htmlFor ?? (single?.props.id as string | undefined) ?? auto;
  const noteId = `${id}-note`;
  const control =
    single && !htmlFor
      ? cloneElement(single, {
          id,
          'aria-describedby': error || hint ? noteId : undefined,
          'aria-invalid': error ? true : single.props['aria-invalid'],
        })
      : children;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      {control}
      {error ? (
        <p id={noteId} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-sm text-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[15px]">
      <input type="checkbox" className="size-4 accent-blue" {...p} />
      {label}
    </label>
  );
}
