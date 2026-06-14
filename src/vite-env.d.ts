/// <reference types="vite/client" />

interface SaveFilePickerOptions {
  suggestedName?: string;
  startIn?:
    | FileSystemHandle
    | "desktop"
    | "documents"
    | "downloads"
    | "music"
    | "pictures"
    | "videos";
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: "read" | "readwrite";
  startIn?: SaveFilePickerOptions["startIn"];
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}
