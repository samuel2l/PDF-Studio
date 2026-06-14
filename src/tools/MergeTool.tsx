import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { PdfFileList } from "../components/PdfFileList";
import { StatusMessage, ToolShell } from "../components/ToolShell";
import { loadPdfFile, mergePdfs } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { sanitizeFilename, saveFile } from "../lib/utils";

export function MergeTool() {
  const [pdfs, setPdfs] = useState<LoadedPdf[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    if (pdfs.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await mergePdfs(pdfs);
      await saveFile({
        data: bytes,
        filename: `${sanitizeFilename(pdfs[0].name)}_merged.pdf`,
        mime: "application/pdf",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Merge PDFs"
      description="Combine multiple PDF files into a single document. Files are merged in the order shown below."
    >
      <div className="space-y-6">
        <FileDropzone
          multiple
          label="Upload PDFs to merge"
          hint="Add files one at a time or select multiple"
          onFiles={async (files) => {
            setError(null);
            try {
              const loaded = await Promise.all(files.map((f) => loadPdfFile(f)));
              setPdfs((prev) => [...prev, ...loaded]);
            } catch {
              setError("One or more PDFs could not be read");
            }
          }}
        />

        <PdfFileList pdfs={pdfs} onRemove={(id) => setPdfs((prev) => prev.filter((p) => p.id !== id))} />

        {pdfs.length >= 2 && (
          <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleMerge}>
            Merge {pdfs.length} PDFs
          </Button>
        )}

        {pdfs.length === 1 && (
          <StatusMessage type="info">Add at least one more PDF to merge.</StatusMessage>
        )}
        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
