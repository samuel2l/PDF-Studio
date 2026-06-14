import { formatBytes } from "../lib/utils";

interface PdfFileListProps {
  pdfs: { id: string; name: string; pageCount: number; bytes: Uint8Array }[];
  onRemove?: (id: string) => void;
}

export function PdfFileList({ pdfs, onRemove }: PdfFileListProps) {
  if (pdfs.length === 0) return null;

  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
      {pdfs.map((pdf) => (
        <li key={pdf.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{pdf.name}</p>
            <p className="text-xs text-slate-500">
              {pdf.pageCount} page{pdf.pageCount === 1 ? "" : "s"} · {formatBytes(pdf.bytes.length)}
            </p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(pdf.id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
