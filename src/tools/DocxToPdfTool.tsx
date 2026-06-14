import { Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { StatusMessage, ToolShell } from "../components/ToolShell";
import { convertDocxElementToPdf, renderDocxPreview } from "../lib/docx";
import { getUserErrorMessage, sanitizeFilename, saveFile } from "../lib/utils";

export function DocxToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file || !previewRef.current) return;

    let cancelled = false;
    setPreviewLoading(true);
    setError(null);

    renderDocxPreview(file, previewRef.current)
      .catch((e) => {
        if (!cancelled) {
          setError(getUserErrorMessage(e, "Couldn't preview this document. Make sure it's a valid .docx file."));
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleConvert = async () => {
    if (!file || !previewRef.current) return;
    setLoading(true);
    setProgress("Creating PDF…");
    setError(null);
    try {
      const bytes = await convertDocxElementToPdf(previewRef.current);
      await saveFile({
        data: bytes,
        filename: `${sanitizeFilename(file.name)}.pdf`,
        mime: "application/pdf",
      });
      setProgress("Done!");
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't convert this document to PDF. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Word to PDF"
      description="Convert DOCX files to PDF entirely in your browser. Preview your document before exporting."
    >
      <div className="space-y-6">
        <FileDropzone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          label="Upload a Word document"
          hint="DOCX format only (.docx) — files stay on your device"
          onFiles={(files) => {
            setError(null);
            setProgress(null);
            setFile(files[0]);
          }}
          files={file ? [file] : []}
          onClear={() => {
            setFile(null);
            if (previewRef.current) previewRef.current.innerHTML = "";
          }}
        />

        {file && (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Preview
              </div>
              <div className="max-h-[480px] overflow-auto p-4">
                {previewLoading && (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    Loading preview…
                  </div>
                )}
                <div
                  ref={previewRef}
                  className="mx-auto min-h-[200px] max-w-[794px] bg-white shadow-sm [&_.docx-wrapper]:bg-white"
                />
              </div>
            </div>

            <StatusMessage type="info">
              Complex layouts, fonts, and tables may look slightly different from Microsoft Word.
              Simple documents convert best.
            </StatusMessage>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                loading={loading || previewLoading}
                icon={<Download className="h-4 w-4" />}
                onClick={handleConvert}
                disabled={previewLoading}
              >
                Convert to PDF
              </Button>
              {progress && !error && (
                <span className="text-sm text-slate-500">{progress}</span>
              )}
            </div>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
