import { RotateCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { PageGrid } from "../components/PageGrid";
import { Field, StatusMessage, ToolShell, inputClassName } from "../components/ToolShell";
import { buildPagePreviews, loadPdfFile, rotatePagesInPdf } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { getUserErrorMessage, parsePageRanges, sanitizeFilename, saveFile } from "../lib/utils";

export function RotateTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pages, setPages] = useState<Awaited<ReturnType<typeof buildPagePreviews>>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTargetPages = (): number[] => {
    if (!pdf) return [];
    if (rangeInput.trim().toLowerCase() === "all") {
      return Array.from({ length: pdf.pageCount }, (_, i) => i + 1);
    }
    if (selectedIds.size > 0) {
      return pages.filter((p) => selectedIds.has(p.id)).map((p) => p.pageIndex + 1);
    }
    return parsePageRanges(rangeInput, pdf.pageCount);
  };

  const handleRotate = async (delta: 90 | 180 | 270) => {
    if (!pdf) return;
    const targets = getTargetPages();
    if (targets.length === 0) {
      setError("Select pages or enter a valid range");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bytes = await rotatePagesInPdf(pdf, targets, delta);
      await saveFile({
        data: bytes,
        filename: `${sanitizeFilename(pdf.name)}_rotated.pdf`,
        mime: "application/pdf",
      });
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't rotate those pages. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Rotate Pages"
      description="Fix sideways scans by rotating selected pages or the entire document."
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
            <Field label="Page range" hint='Type "all", a range like 1-3, or click pages below'>
              <input
                className={inputClassName}
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
              />
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

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={loading} icon={<RotateCw className="h-4 w-4" />} onClick={() => handleRotate(90)}>
                Rotate 90°
              </Button>
              <Button variant="secondary" loading={loading} onClick={() => handleRotate(180)}>
                Rotate 180°
              </Button>
              <Button variant="secondary" loading={loading} onClick={() => handleRotate(270)}>
                Rotate 270°
              </Button>
            </div>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
