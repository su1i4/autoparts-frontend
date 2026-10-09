'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGet } from '@/shared/api/hooks';
import type { Paginated, Role, User, UserStatus } from '@/shared/api/types';
import { date, phone } from '@/shared/lib/format';
import { Badge, DataTable, Input, PageHeader, Pager, Panel, Select } from '@/shared/ui';
import { ROLE_LABEL } from './labels';

export default function AdminUsers() {
  const router = useRouter();
  const [q, setQ] = useState({ search: '', role: '' as Role | '', status: '' as UserStatus | '', page: 1 });
  const { data, isLoading } = useGet<Paginated<User>>(['admin-users', q], '/admin/users', { ...q, limit: 30 });
  return (
    <>
      <PageHeader title="Пользователи" />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_180px]">
        <Input placeholder="Телефон, имя или email" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value, page: 1 })} />
        <Select value={q.role} onChange={(e) => setQ({ ...q, role: e.target.value as Role, page: 1 })} aria-label="Роль">
          <option value="">Все роли</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value as UserStatus, page: 1 })} aria-label="Статус">
          <option value="">Любой статус</option>
          <option value="ACTIVE">Активные</option>
          <option value="BLOCKED">Заблокированные</option>
        </Select>
      </div>
      <Panel>
        <DataTable<User>
          loading={isLoading}
          rows={data?.items}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          columns={[
            { key: 'p', title: 'Телефон', render: (u) => <span className="code">{phone(u.phone)}</span> },
            { key: 'n', title: 'Имя', render: (u) => u.name ?? '—' },
            { key: 'r', title: 'Роли', render: (u) => <span className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r}>{ROLE_LABEL[r]}</Badge>)}</span> },
            { key: 's', title: 'Статус', render: (u) => (u.status === 'BLOCKED' ? <Badge tone="danger">Заблокирован</Badge> : <Badge tone="ok">Активен</Badge>) },
            { key: 'v', title: 'Нарушения в чате', render: (u) => (u.chatViolations ? <Badge tone="amber">{u.chatViolations}</Badge> : '—') },
            { key: 'd', title: 'Регистрация', render: (u) => date(u.createdAt) },
          ]}
        />
        {data && <Pager page={q.page} total={data.total} limit={data.limit} onPage={(page) => setQ({ ...q, page })} />}
      </Panel>
    </>
  );
}
