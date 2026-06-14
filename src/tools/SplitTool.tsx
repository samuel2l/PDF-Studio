import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, inputClassName } from "../components/ToolShell";
import { exportMultiplePdfs, loadPdfFile, splitPdfByRanges, splitPdfEveryPage } from "../lib/pdf";
import type { LoadedPdf } from "../types";

export function SplitTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [mode, setMode] = useState<"every" | "ranges">("every");
  const [rangesInput, setRangesInput] = useState("1-3, 4-6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSplit = async () => {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "every") {
        const parts = await splitPdfEveryPage(pdf);
        await exportMultiplePdfs(parts);
      } else {
        const ranges = rangesInput
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const [start, end] = part.split("-").map((v) => Number(v.trim()));
            return { start, end: end ?? start };
          })
          .filter((r) => r.start >= 1 && r.end <= pdf.pageCount && r.start <= r.end);

        if (ranges.length === 0) {
          setError("Enter valid page ranges like 1-3, 5-8");
          return;
        }

        const parts = await splitPdfByRanges(pdf, ranges);
        await exportMultiplePdfs(parts);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Split failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Split PDF"
      description="Break a PDF into separate files — either one file per page or custom page ranges."
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
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("every")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "every"
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-800">Every page</p>
                <p className="mt-1 text-sm text-slate-500">
                  Download {pdf.pageCount} separate PDFs
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode("ranges")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "ranges"
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-800">Custom ranges</p>
                <p className="mt-1 text-sm text-slate-500">Split by groups like 1-3, 4-8</p>
              </button>
            </div>

            {mode === "ranges" && (
              <Field label="Page ranges" hint={`Document has ${pdf.pageCount} pages`}>
                <input
                  className={inputClassName}
                  value={rangesInput}
                  onChange={(e) => setRangesInput(e.target.value)}
                  placeholder="1-3, 4-6, 7-10"
                />
              </Field>
            )}

            <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleSplit}>
              Split and download
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
