import {
  clearDirectoryHandle,
  ensureDirectoryPermission,
  loadDirectoryHandle,
  storeDirectoryHandle,
} from "./file-handle-store";
import {
  defaultSaveSettings,
  loadSaveSettings,
  storeSaveSettings,
  type SaveSettings,
  type SaveStartIn,
} from "./save-settings";

export interface SaveResult {
  method: "picker" | "folder" | "download";
  filename: string;
}

export interface SaveFileInput {
  data: Uint8Array | Blob;
  filename: string;
  mime?: string;
}

function supportsSavePicker(): boolean {
  return typeof window.showSaveFilePicker === "function";
}

function supportsDirectoryPicker(): boolean {
  return typeof window.showDirectoryPicker === "function";
}

function toBlob(data: Uint8Array | Blob, mime: string): Blob {
  if (data instanceof Blob) return data;
  return new Blob([data], { type: mime });
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function writeToDirectory(
  dir: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function saveWithPicker(
  blob: Blob,
  filename: string,
  mime: string,
  startIn: SaveStartIn,
): Promise<SaveResult> {
  const handle = await window.showSaveFilePicker!({
    suggestedName: filename,
    startIn,
    types: [
      {
        description: "File",
        accept: { [mime]: [`.${filename.split(".").pop() ?? "bin"}`] },
      },
    ],
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return { method: "picker", filename: handle.name };
}

async function saveWithStoredFolder(blob: Blob, filename: string): Promise<SaveResult | null> {
  const dir = await loadDirectoryHandle();
  if (!dir) return null;
  const allowed = await ensureDirectoryPermission(dir);
  if (!allowed) return null;
  await writeToDirectory(dir, filename, blob);
  return { method: "folder", filename };
}

export function getSaveSettings(): SaveSettings {
  return loadSaveSettings();
}

export function updateSaveSettings(settings: SaveSettings): void {
  storeSaveSettings(settings);
}

export async function chooseOutputFolder(): Promise<SaveSettings> {
  if (!supportsDirectoryPicker()) {
    throw new Error("Your browser does not support choosing a save folder.");
  }

  const handle = await window.showDirectoryPicker!();
  await storeDirectoryHandle(handle);
  const next: SaveSettings = {
    ...loadSaveSettings(),
    mode: "saved-folder",
    folderLabel: handle.name,
  };
  storeSaveSettings(next);
  return next;
}

export async function clearOutputFolder(): Promise<SaveSettings> {
  await clearDirectoryHandle();
  const next: SaveSettings = {
    ...loadSaveSettings(),
    mode: "choose-location",
    folderLabel: null,
  };
  storeSaveSettings(next);
  return next;
}

export async function saveFile(input: SaveFileInput): Promise<SaveResult> {
  const settings = loadSaveSettings();
  const mime = input.mime ?? "application/octet-stream";
  const blob = toBlob(input.data, mime);

  if (settings.mode === "saved-folder") {
    const saved = await saveWithStoredFolder(blob, input.filename);
    if (saved) return saved;
  }

  if (settings.mode === "choose-location" && supportsSavePicker()) {
    try {
      return await saveWithPicker(blob, input.filename, mime, settings.startIn);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  triggerBrowserDownload(blob, input.filename);
  return { method: "download", filename: input.filename };
}

export async function saveFiles(inputs: SaveFileInput[]): Promise<SaveResult[]> {
  if (inputs.length === 0) return [];

  const settings = loadSaveSettings();
  const dir =
    settings.mode === "saved-folder" ? await loadDirectoryHandle() : null;
  const folderAllowed = dir ? await ensureDirectoryPermission(dir) : false;

  if (dir && folderAllowed) {
    const results: SaveResult[] = [];
    for (const input of inputs) {
      const mime = input.mime ?? "application/octet-stream";
      const blob = toBlob(input.data, mime);
      await writeToDirectory(dir, input.filename, blob);
      results.push({ method: "folder", filename: input.filename });
    }
    return results;
  }

  const results: SaveResult[] = [];
  for (const input of inputs) {
    results.push(await saveFile(input));
  }
  return results;
}

export function describeSaveBehavior(settings: SaveSettings = loadSaveSettings()): string {
  if (settings.mode === "saved-folder" && settings.folderLabel) {
    return `Files save to "${settings.folderLabel}" on your computer.`;
  }
  if (settings.mode === "browser-downloads") {
    return "Files save to your browser's default Downloads folder.";
  }
  if (supportsSavePicker()) {
    return `You'll pick where to save each file (dialog opens in ${settings.startIn}).`;
  }
  return "Files save to your browser's default Downloads folder.";
}

export { defaultSaveSettings, loadSaveSettings, storeSaveSettings };
export type { SaveSettings, SaveStartIn };
