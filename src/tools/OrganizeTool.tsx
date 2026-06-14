import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { PageGrid } from "../components/PageGrid";
import { Field, StatusMessage, ToolShell, inputClassName, selectClassName } from "../components/ToolShell";
import {
  applyOrganizedPages,
  buildPagePreviews,
  insertPagesFromPdf,
  loadPdfFile,
} from "../lib/pdf";
import type { LoadedPdf, PagePreview } from "../types";
import { downloadBytes, parsePageRanges, sanitizeFilename } from "../lib/utils";

export function OrganizeTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [insertPdf, setInsertPdf] = useState<LoadedPdf | null>(null);
  const [insertPages, setInsertPages] = useState("1");
  const [insertAt, setInsertAt] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceMap = useMemo(() => {
    const map = new Map<string, LoadedPdf>();
    if (pdf) map.set(pdf.name, pdf);
    if (insertPdf) map.set(insertPdf.name, insertPdf);
    return map;
  }, [pdf, insertPdf]);

  const loadMainPdf = async (file: File) => {
    setError(null);
    const loaded = await loadPdfFile(file);
    setPdf(loaded);
    setPages(await buildPagePreviews(loaded));
    setSelectedIds(new Set());
  };

  const handleDownload = async () => {
    if (!pdf || pages.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await applyOrganizedPages(pages, sourceMap);
      downloadBytes(bytes, `${sanitizeFilename(pdf.name)}_organized.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    if (!pdf || !insertPdf) return;
    setLoading(true);
    setError(null);
    try {
      const pageNumbers = parsePageRanges(insertPages, insertPdf.pageCount);
      if (pageNumbers.length === 0) {
        setError("Enter valid pages to insert from the second PDF");
        return;
      }
      const bytes = await insertPagesFromPdf(pdf, insertPdf, pageNumbers, insertAt - 1);
      const updated = await loadPdfFile(new File([bytes], pdf.name));
      setPdf(updated);
      setPages(await buildPagePreviews(updated));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Insert failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = () => {
    setPages((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  return (
    <ToolShell
      title="Organize Pages"
      description="Drag to reorder, delete unwanted pages, rotate them, or insert pages from another PDF."
      actions={
        pages.length > 0 ? (
          <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleDownload}>
            Download organized PDF
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <FileDropzone
          label="Upload the PDF to organize"
          onFiles={async (files) => {
            try {
              await loadMainPdf(files[0]);
            } catch {
              setError("Could not read this PDF file");
            }
          }}
          files={pdf ? [new File([pdf.bytes], pdf.name)] : []}
          onClear={() => {
            setPdf(null);
            setPages([]);
          }}
        />

        {pages.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={deleteSelected}
                disabled={selectedIds.size === 0}
              >
                Delete selected ({selectedIds.size})
              </Button>
              <Button variant="ghost" onClick={() => setSelectedIds(new Set(pages.map((p) => p.id)))}>
                Select all
              </Button>
              <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear selection
              </Button>
            </div>

            <PageGrid
              pages={pages}
              selectedIds={selectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onReorder={setPages}
              onRotate={(id) =>
                setPages((prev) =>
                  prev.map((p) =>
                    p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
                  ),
                )
              }
              onDelete={(id) => setPages((prev) => prev.filter((p) => p.id !== id))}
              sortable
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Plus className="h-4 w-4 text-brand-600" />
                Insert pages from another PDF
              </div>
              <FileDropzone
                label="Upload source PDF for pages to insert"
                onFiles={async (files) => {
                  try {
                    setInsertPdf(await loadPdfFile(files[0]));
                  } catch {
                    setError("Could not read insert PDF");
                  }
                }}
                files={insertPdf ? [new File([insertPdf.bytes], insertPdf.name)] : []}
                onClear={() => setInsertPdf(null)}
              />
              {insertPdf && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pages to insert" hint="e.g. 1, 3-5">
                    <input
                      className={inputClassName}
                      value={insertPages}
                      onChange={(e) => setInsertPages(e.target.value)}
                    />
                  </Field>
                  <Field label="Insert before page">
                    <select
                      className={selectClassName}
                      value={insertAt}
                      onChange={(e) => setInsertAt(Number(e.target.value))}
                    >
                      {Array.from({ length: (pdf?.pageCount ?? 0) + 1 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n === (pdf?.pageCount ?? 0) + 1 ? "At end" : `Before page ${n}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
              {insertPdf && (
                <Button variant="secondary" loading={loading} onClick={handleInsert}>
                  Insert pages
                </Button>
              )}
            </div>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
