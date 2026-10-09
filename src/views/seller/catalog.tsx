'use client';

import { Boxes, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { importParts, useMyParts } from '@/entities/part/api';
import { useMyStores } from '@/entities/seller/api';
import type { Part } from '@/shared/api/types';
import { errorMessage } from '@/shared/lib/errors';
import { money } from '@/shared/lib/format';
import { Badge, Button, buttonClass, DataTable, Dialog, Empty, Field, Input, PageHeader, Pager, Panel, Photo, Select } from '@/shared/ui';

function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('seller.catalog');
  const tt = useTranslations('seller.table');
  const { data: stores } = useMyStores();
  const qc = useQueryClient();
  const [storeId, setStoreId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Awaited<ReturnType<typeof importParts>> | null>(null);

  return (
    <Dialog open={open} onClose={onClose} title={t('importTitle')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">{t('importHint')}</p>
        <Field label={tt('store')}>
          <Select value={storeId || stores?.[0]?.id || ''} onChange={(e) => setStoreId(e.target.value)}>
            {stores?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="py-2" />
        <Button
          variant="blue"
          loading={busy}
          disabled={!file}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await importParts(storeId || stores![0].id, file!);
              setReport(r);
              toast.success(t('importDone', { imported: r.imported, total: r.total }));
              qc.invalidateQueries({ queryKey: ['my-parts'] });
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Upload className="size-4" /> {t('import')}
        </Button>
        {report && !!report.errors.length && (
          <ul className="max-h-48 overflow-y-auto rounded-lg bg-danger-tint p-3 text-sm text-danger">
            {report.errors.map((e) => (
              <li key={e.row}>{tt('row', { row: e.row, error: e.error })}</li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

export default function SellerCatalogView() {
  const t = useTranslations('seller.catalog');
  const tc = useTranslations('common');
  const to = useTranslations('seller.offer');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const { data, isLoading } = useMyParts(page);

  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> {t('import')}
            </Button>
            <Link href="/seller/catalog/new" className={buttonClass('primary')}>
              {t('add')}
            </Link>
          </>
        }
      />
      <Panel>
        {!isLoading && !data?.items.length ? (
          <Empty
            icon={<Boxes className="size-10" />}
            title={t('empty')}
            text={t('emptyText')}
            action={
              <Link href="/seller/catalog/new" className={buttonClass('primary')}>
                {t('add')}
              </Link>
            }
          />
        ) : (
          <DataTable<Part>
            loading={isLoading}
            rows={data?.items}
            onRowClick={(p) => router.push(`/seller/catalog/${p.id}`)}
            columns={[
              { key: 'ph', title: '', className: 'w-14', render: (p) => <Photo src={p.photos[0]} className="size-10 rounded-md" /> },
              {
                key: 'n',
                title: t('name'),
                render: (p) => (
                  <span>
                    <span className="font-medium">{p.name}</span>
                    {!p.isActive && <Badge className="ml-2">{t('hidden')}</Badge>}
                  </span>
                ),
              },
              { key: 'o', title: 'OEM', render: (p) => <span className="code text-sm">{p.oemNumbers.join(', ') || '—'}</span> },
              { key: 'c', title: to('condition'), render: (p) => tc(`condition.${p.condition}`) },
              { key: 'p', title: t('price'), render: (p) => <span className="num">{money(p.price, p.currency)}</span> },
              { key: 's', title: t('stock'), render: (p) => <span className="num">{p.stock}</span> },
            ]}
          />
        )}
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
