import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { FileDropzone } from "../components/FileDropzone";
import { StatusMessage, ToolShell } from "../components/ToolShell";
import { imagesToPdf } from "../lib/pdf";
import { saveFile } from "../lib/utils";

export function ImagesToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const bytes = await imagesToPdf(files);
      await saveFile({
        data: bytes,
        filename: "images_combined.pdf",
        mime: "application/pdf",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell
      title="Images to PDF"
      description="Turn JPG and PNG photos or scans into a single PDF document."
    >
      <div className="space-y-6">
        <FileDropzone
          multiple
          accept="image/png,image/jpeg,image/jpg"
          label="Upload images"
          hint="PNG and JPG supported — order matches upload order"
          onFiles={(incoming) => setFiles((prev) => [...prev, ...incoming])}
        />

        {files.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="aspect-square w-full object-cover"
                />
                <p className="truncate px-2 py-1 text-xs text-slate-600">{file.name}</p>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <div className="flex gap-2">
            <Button loading={loading} icon={<Download className="h-4 w-4" />} onClick={handleConvert}>
              Create PDF from {files.length} image{files.length === 1 ? "" : "s"}
            </Button>
            <Button variant="ghost" onClick={() => setFiles([])}>
              Clear
            </Button>
          </div>
        )}

        {error && <StatusMessage type="error">{error}</StatusMessage>}
      </div>
    </ToolShell>
  );
}
