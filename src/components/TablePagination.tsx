import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, pageSize, totalItems, onPageChange }: TablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">
          Rows {start.toLocaleString()}–{end.toLocaleString()}
        </span>
        <span className="text-slate-400"> of </span>
        <span className="font-medium text-slate-800">{totalItems.toLocaleString()}</span>
        {totalPages > 1 && (
          <span className="mt-0.5 block text-xs text-slate-500">
            Page {page} of {totalPages} — use Next for more rows
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-brand-200 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
