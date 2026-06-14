export type SaveStartIn = "downloads" | "desktop" | "documents";

export type SaveMode =
  | "choose-location"
  | "browser-downloads"
  | "saved-folder";

export interface SaveSettings {
  mode: SaveMode;
  startIn: SaveStartIn;
  folderLabel: string | null;
}

const STORAGE_KEY = "pdf-studio-save-settings";

export const defaultSaveSettings: SaveSettings = {
  mode: "choose-location",
  startIn: "downloads",
  folderLabel: null,
};

export function loadSaveSettings(): SaveSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSaveSettings;
    return { ...defaultSaveSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSaveSettings;
  }
}

export function storeSaveSettings(settings: SaveSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function saveStartInLabel(startIn: SaveStartIn): string {
  switch (startIn) {
    case "desktop":
      return "Desktop";
    case "documents":
      return "Documents";
    default:
      return "Downloads";
  }
}

export function saveModeLabel(mode: SaveMode): string {
  switch (mode) {
    case "browser-downloads":
      return "Browser Downloads folder";
    case "saved-folder":
      return "Your chosen folder";
    default:
      return "Ask where to save";
  }
}
