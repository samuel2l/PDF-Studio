import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { Field, StatusMessage, ToolShell, inputClassName, selectClassName } from "../components/ToolShell";
import { addPageNumbers, loadPdfFile } from "../lib/pdf";
import type { LoadedPdf } from "../types";
import { getUserErrorMessage, sanitizeFilename, saveFile } from "../lib/utils";

export function PageNumbersTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [position, setPosition] = useState<
    "bottom-center" | "bottom-right" | "top-center" | "top-right"
  >("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [prefix, setPrefix] = useState("");
  const [fontSize, setFontSize] = useState(11);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!pdf) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await addPageNumbers(pdf, { position, startAt, prefix, fontSize });
      await saveFile({
        data: bytes,
        filename: `${sanitizeFilename(pdf.name)}_numbered.pdf`,
        mime: "application/pdf",
      });
    } catch (e) {
      setError(getUserErrorMessage(e, "Couldn't add page numbers. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Page Numbers"
      description="Add clean page numbers to headers or footers with a custom starting number."
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
              <Field label="Position">
                <select
                  className={selectClassName}
                  value={position}
                  onChange={(e) => setPosition(e.target.value as typeof position)}
                >
                  <option value="bottom-center">Bottom center</option>
                  <option value="bottom-right">Bottom right</option>
                  <option value="top-center">Top center</option>
                  <option value="top-right">Top right</option>
                </select>
              </Field>
              <Field label="Start numbering at">
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  value={startAt}
                  onChange={(e) => setStartAt(Number(e.target.value))}
                />
              </Field>
              <Field label="Prefix (optional)" hint='e.g. "Page " becomes "Page 1"'>
                <input className={inputClassName} value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              </Field>
              <Field label="Font size">
                <input
                  type="number"
                  min={8}
                  max={24}
                  className={inputClassName}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </Field>
            </div>

            <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleApply}>
              Add page numbers and download
            </Button>
          </>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
