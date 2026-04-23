import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TableSurface } from '@/components/ui/TableSurface';

type DataTableColumn = {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  colGroup?: ReactNode;
  children: ReactNode;
};

const ALIGN_CLASS: Record<NonNullable<DataTableColumn['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable({ columns, colGroup, children }: DataTableProps) {
  return (
    <TableSurface>
      <table className="min-w-full table-fixed">
        {colGroup}
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500',
                  ALIGN_CLASS[column.align ?? 'left'],
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </TableSurface>
  );
}
