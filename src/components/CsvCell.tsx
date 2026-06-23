import { Check, Copy, ExternalLink, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { inputClassName } from "./ToolShell";
import { copyToClipboard } from "../lib/utils";

interface CsvCellProps {
  value: string;
  onSave?: (value: string) => void;
}

function isUrl(value: string): boolean {
  const v = value.trim();
  return /^https?:\/\//i.test(v) || /^www\./i.test(v);
}

function openUrl(value: string) {
  const v = value.trim();
  const href = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export function CsvCell({ value, onSave }: CsvCellProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setDraft(value);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const url = isUrl(value);
  const editable = Boolean(onSave);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const text = editing ? draft : value;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSave = () => {
    onSave?.(draft);
    setOpen(false);
  };

  return (
    <>
      <div className="group/cell flex max-w-[280px] items-center gap-0.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`min-w-0 flex-1 truncate text-left hover:text-brand-700 ${!value ? "text-slate-300" : ""}`}
          title={editable ? "View or edit" : "View full value"}
        >
          {value || "—"}
        </button>
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md p-1 text-slate-400 opacity-100 transition hover:bg-brand-50 hover:text-brand-600 sm:opacity-0 sm:group-hover/cell:opacity-100"
            title="Copy"
            aria-label="Copy cell value"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {editable && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setOpen(true);
            }}
            className="shrink-0 rounded-md p-1 text-slate-400 opacity-100 transition hover:bg-brand-50 hover:text-brand-600 sm:opacity-0 sm:group-hover/cell:opacity-100"
            title="Edit"
            aria-label="Edit cell"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                {editing ? "Edit cell" : "Cell value"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[40vh] overflow-auto p-4">
              {editing ? (
                <textarea
                  className={`${inputClassName} min-h-[120px] resize-y font-mono text-sm`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                />
              ) : (
                <p className="select-all break-all text-sm text-slate-800">{value || "—"}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
              {editing ? (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {url && (
                    <button
                      type="button"
                      onClick={() => openUrl(value)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open link
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
