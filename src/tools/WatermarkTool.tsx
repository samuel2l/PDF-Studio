import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, inputClassName } from "../components/ToolShell";
import { addWatermark, loadPdfFile } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { downloadBytes, sanitizeFilename } from "../lib/utils";

export function WatermarkTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.15);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-35);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!pdf || !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await addWatermark(pdf, text.trim(), {
        opacity,
        fontSize,
        rotation,
        color: { r: 0.4, g: 0.4, b: 0.4 },
      });
      downloadBytes(bytes, `${sanitizeFilename(pdf.name)}_watermarked.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Watermark failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Add Watermark"
      description="Stamp custom text diagonally across every page — great for drafts and confidential copies."
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Watermark text">
                <input className={inputClassName} value={text} onChange={(e) => setText(e.target.value)} />
              </Field>
              <Field label="Font size">
                <input
                  type="number"
                  min={12}
                  max={120}
                  className={inputClassName}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </Field>
              <Field label="Opacity">
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </Field>
              <Field label="Rotation (degrees)">
                <input
                  type="number"
                  className={inputClassName}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <span
                className="select-none font-bold text-slate-400"
                style={{
                  fontSize: Math.min(fontSize / 2, 36),
                  opacity,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {text || "Preview"}
              </span>
            </div>

            <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleApply}>
              Apply watermark and download
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
