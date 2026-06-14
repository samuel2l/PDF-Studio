import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { PageGrid } from "../components/PageGrid";
import { Field, StatusMessage, ToolShell, inputClassName } from "../components/ToolShell";
import { buildPagePreviews, extractPages, loadPdfFile } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { getUserErrorMessage, parsePageRanges, sanitizeFilename, saveFile } from "../lib/utils";

export function ExtractTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pages, setPages] = useState<Awaited<ReturnType<typeof buildPagePreviews>>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPageNumbers = pages
    .filter((p) => selectedIds.has(p.id))
    .map((p) => p.pageIndex + 1)
    .sort((a, b) => a - b);

  const handleExtract = async () => {
    if (!pdf || selectedPageNumbers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await extractPages(pdf, selectedPageNumbers);
      await saveFile({
        data: bytes,
        filename: `${sanitizeFilename(pdf.name)}_extracted.pdf`,
        mime: "application/pdf",
      });
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't extract those pages. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Extract Pages"
      description="Pick specific pages visually or type a range, then save them as a new PDF."
    >
      <div className="space-y-6">
        <FileDropzone
          onFiles={async (files) => {
            setError(null);
            try {
              const loaded = await loadPdfFile(files[0]);
              setPdf(loaded);
              setPages(await buildPagePreviews(loaded));
              setSelectedIds(new Set());
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

        {pdf && (
          <>
            <Field label="Quick select by range" hint="e.g. 1, 3-5, 8">
              <div className="flex gap-2">
                <input
                  className={inputClassName}
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="1-3, 5"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const nums = parsePageRanges(rangeInput, pdf.pageCount);
                    setSelectedIds(new Set(pages.filter((p) => nums.includes(p.pageIndex + 1)).map((p) => p.id)));
                  }}
                >
                  Select
                </Button>
              </div>
            </Field>

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
            />

            <Button
              loading={loading}
              icon={<Download className="h-4 w-4" />}
              disabled={selectedPageNumbers.length === 0}
              onClick={handleExtract}
            >
              Extract {selectedPageNumbers.length || ""} page
              {selectedPageNumbers.length === 1 ? "" : "s"}
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
