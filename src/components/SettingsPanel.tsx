import { FolderOpen, Settings2, X } from "lucide-react";
import { useState } from "react";
import {
  chooseOutputFolder,
  clearOutputFolder,
  describeSaveBehavior,
  getSaveSettings,
  updateSaveSettings,
  type SaveSettings,
  type SaveStartIn,
} from "../lib/save";
import { saveModeLabel, saveStartInLabel } from "../lib/save-settings";
import { Button } from "./Button";
import { Field, StatusMessage, selectClassName } from "./ToolShell";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SaveSettings>(() => getSaveSettings());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const applySettings = (next: SaveSettings) => {
    updateSaveSettings(next);
    setSettings(next);
    setMessage("Save preferences updated.");
    setError(null);
  };

  const handleChooseFolder = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await chooseOutputFolder();
      setSettings(next);
      setMessage(`Saving to "${next.folderLabel}" from now on.`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Could not choose folder");
    } finally {
      setBusy(false);
    }
  };

  const handleClearFolder = async () => {
    const next = await clearOutputFolder();
    setSettings(next);
    setMessage("Folder cleared. You'll pick a location when saving.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Save settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <p className="text-sm text-slate-600">
            All PDF work happens in your browser. When you export, files are written directly to
            your computer — never uploaded to our servers.
          </p>

          <Field label="How to save files">
            <select
              className={selectClassName}
              value={settings.mode}
              onChange={(e) =>
                applySettings({
                  ...settings,
                  mode: e.target.value as SaveSettings["mode"],
                })
              }
            >
              <option value="choose-location">{saveModeLabel("choose-location")}</option>
              <option value="browser-downloads">{saveModeLabel("browser-downloads")}</option>
              <option value="saved-folder">{saveModeLabel("saved-folder")}</option>
            </select>
          </Field>

          {settings.mode === "choose-location" && (
            <Field
              label="Default folder in save dialog"
              hint="The save dialog opens here first — you can still browse anywhere"
            >
              <select
                className={selectClassName}
                value={settings.startIn}
                onChange={(e) =>
                  applySettings({
                    ...settings,
                    startIn: e.target.value as SaveStartIn,
                  })
                }
              >
                <option value="downloads">{saveStartInLabel("downloads")}</option>
                <option value="desktop">{saveStartInLabel("desktop")}</option>
                <option value="documents">{saveStartInLabel("documents")}</option>
              </select>
            </Field>
          )}

          {settings.mode === "saved-folder" && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 space-y-3">
              <p className="text-sm text-brand-900">
                {settings.folderLabel
                  ? `Current folder: ${settings.folderLabel}`
                  : "Choose a folder on your computer to save files automatically."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  loading={busy}
                  icon={<FolderOpen className="h-4 w-4" />}
                  onClick={handleChooseFolder}
                >
                  {settings.folderLabel ? "Change folder" : "Choose folder"}
                </Button>
                {settings.folderLabel && (
                  <Button variant="ghost" onClick={handleClearFolder}>
                    Clear folder
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {describeSaveBehavior(settings)}
          </div>

          {message && <StatusMessage type="success">{message}</StatusMessage>}
          {error && <StatusMessage type="error">{error}</StatusMessage>}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <Button className="w-full sm:w-auto" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SaveSettingsBadge({ onOpenSettings }: { onOpenSettings: () => void }) {
  const settings = getSaveSettings();
  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      title="Change where files are saved"
    >
      <Settings2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">
        Save to:{" "}
        {settings.mode === "saved-folder" && settings.folderLabel
          ? settings.folderLabel
          : settings.mode === "browser-downloads"
            ? "Downloads"
            : saveStartInLabel(settings.startIn)}
      </span>
      <span className="sm:hidden">Save settings</span>
    </button>
  );
}
