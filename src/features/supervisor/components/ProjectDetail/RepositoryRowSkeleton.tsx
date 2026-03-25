import React from 'react';

export function RepositoryRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-slate-100 last:border-0">
      <td className="px-4 py-3.5">
        <div className="h-4 w-32 rounded bg-slate-100" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-4 w-24 rounded bg-slate-100" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-4 w-28 rounded bg-slate-100" />
      </td>
      <td className="px-4 py-3.5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-12 rounded bg-slate-50" />
            <div className="h-6 w-11 rounded-full bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-12 rounded bg-slate-50" />
            <div className="h-6 w-11 rounded-full bg-slate-100" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-full bg-slate-100" />
          <div className="h-10 w-10 rounded-full bg-slate-100" />
          <div className="h-10 w-10 rounded-full bg-slate-100" />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full bg-slate-100" />
        </div>
      </td>
    </tr>
  );
}
