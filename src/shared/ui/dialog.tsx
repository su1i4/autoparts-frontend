'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';

/** Модалка на нативном <dialog>: фокус-ловушка и Esc из коробки */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        'm-auto max-h-[90dvh] w-[calc(100%-24px)] max-w-lg overflow-y-auto rounded-2xl border border-steel-light bg-surface p-0 text-ink',
        className,
      )}
    >
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-mute hover:bg-steel-light" aria-label="Закрыть">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
