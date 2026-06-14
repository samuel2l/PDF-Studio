export function downloadBytes(data: Uint8Array, filename: string, mime = "application/pdf") {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/[^\w.-]+/g, "_") || "document";
}

export function uniqueId(): string {
  return crypto.randomUUID();
}

export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

export function parsePageRanges(input: string, maxPage: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const pages = new Set<number>();
  for (const part of trimmed.split(",")) {
    const segment = part.trim();
    if (!segment) continue;

    if (segment.includes("-")) {
      const [startRaw, endRaw] = segment.split("-").map((v) => v.trim());
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const lo = Math.max(1, Math.min(start, end));
      const hi = Math.min(maxPage, Math.max(start, end));
      for (let i = lo; i <= hi; i++) pages.add(i);
    } else {
      const page = Number(segment);
      if (Number.isFinite(page) && page >= 1 && page <= maxPage) pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function basename(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}
