import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, selectClassName } from "../components/ToolShell";
import { exportImages, loadPdfFile, pdfToImages } from "../lib/pdf";
import type { LoadedPdf } from "../types";

export function PdfToImagesTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const images = await pdfToImages(pdf, format, quality, scale);
      await exportImages(images);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="PDF to Images"
      description="Export every page as a PNG or JPEG image. Multiple pages download as a ZIP."
    >
      <div className="space-y-6">
        <FileDropzone
          onFiles={async (files) => {
            setError(null);
            try {
              setPdf(await loadPdfFile(files[0]));
            } catch {
              setError("Could not read this PDF file");
            }
          }}
          files={pdf ? [new File([pdf.bytes], pdf.name)] : []}
          onClear={() => setPdf(null)}
        />

        {pdf && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Format">
                <select className={selectClassName} value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg")}>
                  <option value="png">PNG — lossless</option>
                  <option value="jpeg">JPEG — smaller files</option>
                </select>
              </Field>
              <Field label="Resolution scale" hint="2× is sharp on most screens">
                <select className={selectClassName} value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                  <option value={1}>1× — standard</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2× — recommended</option>
                  <option value={3}>3× — high quality</option>
                </select>
              </Field>
              {format === "jpeg" && (
                <Field label="JPEG quality">
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </Field>
              )}
            </div>

            <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleExport}>
              Export {pdf.pageCount} page{pdf.pageCount === 1 ? "" : "s"}
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
