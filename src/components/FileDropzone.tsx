import { Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: File[]) => void;
  files?: File[];
  onClear?: () => void;
}

export function FileDropzone({
  accept = ".pdf,application/pdf",
  multiple = false,
  label = "Drop files here",
  hint = "or click to browse",
  onFiles,
  files = [],
  onClear,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
        }`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 transition group-hover:scale-105">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{file.name}</p>
                <p className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
