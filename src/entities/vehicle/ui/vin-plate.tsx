import { cn } from '@/shared/lib/cn';

/** Статичная VIN-табличка — главный визуальный мотив площадки */
export function VinPlate({ vin, caption, className, size = 'md' }: { vin: string; caption?: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('vin-plate inline-flex flex-col px-7', size === 'sm' ? 'py-1.5' : 'py-2.5', className)}>
      {caption && <span className="text-[11px] text-ink-mute">{caption}</span>}
      <span className={cn('vin-stamp', size === 'sm' ? 'text-[13px]' : 'text-[17px]')}>{vin}</span>
    </div>
  );
}
