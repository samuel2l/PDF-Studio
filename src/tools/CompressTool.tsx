import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, inputClassName } from "../components/ToolShell";
import { compressPdf, loadPdfFile } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { downloadBytes, formatBytes, sanitizeFilename } from "../lib/utils";

export function CompressTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [quality, setQuality] = useState(0.72);
  const [maxDpi, setMaxDpi] = useState(150);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; ratio: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompress = async () => {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const bytes = await compressPdf(pdf, quality, maxDpi);
      setResult({ bytes, ratio: bytes.length / pdf.bytes.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compression failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Compress PDF"
      description="Shrink large PDFs for email, uploads, and sharing. Processing happens entirely in your browser."
      actions={
        result && (
          <Button
            icon={<Download className="h-4 w-4" />}
            onClick={() =>
              downloadBytes(result.bytes, `${sanitizeFilename(pdf!.name)}_compressed.pdf`)
            }
          >
            Download compressed PDF
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <FileDropzone
          label="Upload a PDF to compress"
          hint="Works best on scanned documents and image-heavy PDFs"
          onFiles={async (files) => {
            setError(null);
            setResult(null);
            try {
              setPdf(await loadPdfFile(files[0]));
            } catch {
              setError("Could not read this PDF file");
            }
          }}
          files={pdf ? [new File([pdf.bytes], pdf.name)] : []}
          onClear={() => {
            setPdf(null);
            setResult(null);
          }}
        />

        {pdf && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Image quality" hint={`${Math.round(quality * 100)}% — lower means smaller files`}>
                <input
                  type="range"
                  min={0.4}
                  max={0.95}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </Field>
              <Field label="Max resolution (DPI)" hint="150 DPI is good for most uploads">
                <select
                  className={inputClassName}
                  value={maxDpi}
                  onChange={(e) => setMaxDpi(Number(e.target.value))}
                >
                  <option value={72}>72 — smallest file</option>
                  <option value={120}>120 — balanced</option>
                  <option value={150}>150 — recommended</option>
                  <option value={200}>200 — sharper</option>
                </select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
              <span className="text-slate-600">
                Original: <strong>{formatBytes(pdf.bytes.length)}</strong>
              </span>
              {result && (
                <>
                  <span className="text-slate-300">→</span>
                  <span className="text-emerald-700">
                    Compressed: <strong>{formatBytes(result.bytes.length)}</strong> (
                    {Math.round(result.ratio * 100)}% of original)
                  </span>
                </>
              )}
            </div>

            <Button loading={loading} onClick={handleCompress}>
              Compress PDF
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
