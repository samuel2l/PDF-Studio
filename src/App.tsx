import { useState, type ReactNode } from "react";
import { Shield, Sparkles } from "lucide-react";
import { SaveSettingsBadge, SettingsPanel } from "./components/SettingsPanel";
import { categoryLabels, tools } from "./config/tools";
import type { ToolId } from "./types";
import { CompressTool } from "./tools/CompressTool";
import { ExtractTool } from "./tools/ExtractTool";
import { ImagesToPdfTool } from "./tools/ImagesToPdfTool";
import { MergeTool } from "./tools/MergeTool";
import { OrganizeTool } from "./tools/OrganizeTool";
import { PageNumbersTool } from "./tools/PageNumbersTool";
import { PdfToImagesTool } from "./tools/PdfToImagesTool";
import { RotateTool } from "./tools/RotateTool";
import { SplitTool } from "./tools/SplitTool";
import { WatermarkTool } from "./tools/WatermarkTool";

const toolComponents: Record<ToolId, () => ReactNode> = {
  compress: CompressTool,
  merge: MergeTool,
  split: SplitTool,
  organize: OrganizeTool,
  extract: ExtractTool,
  rotate: RotateTool,
  "images-to-pdf": ImagesToPdfTool,
  "pdf-to-images": PdfToImagesTool,
  watermark: WatermarkTool,
  "page-numbers": PageNumbersTool,
};

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>("compress");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const ActiveComponent = toolComponents[activeTool];

  const grouped = tools.reduce(
    (acc, tool) => {
      acc[tool.category].push(tool);
      return acc;
    },
    { edit: [], convert: [], optimize: [] } as Record<
      keyof typeof categoryLabels,
      typeof tools
    >,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-slate-50 to-slate-100">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">PDF Studio</h1>
              <p className="text-xs text-slate-500">Free tools · 100% in your browser</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SaveSettingsBadge
              key={settingsVersion}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
              <Shield className="h-3.5 w-3.5" />
              Files never leave your device
            </div>
          </div>
        </div>
      </header>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setSettingsVersion((v) => v + 1);
        }}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-8">
        <aside className="glass h-fit rounded-3xl p-4 lg:sticky lg:top-6">
          <nav className="space-y-5">
            {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => (
              <div key={category}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {categoryLabels[category]}
                </p>
                <ul className="space-y-1">
                  {grouped[category].map((tool) => {
                    const Icon = tool.icon;
                    const active = activeTool === tool.id;
                    return (
                      <li key={tool.id}>
                        <button
                          type="button"
                          onClick={() => setActiveTool(tool.id)}
                          className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                            active
                              ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-white" : "text-brand-600"}`} />
                          <span>
                            <span className="block text-sm font-semibold">{tool.name}</span>
                            {!active && (
                              <span className="mt-0.5 block text-xs text-slate-500">{tool.description}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main>
          <ActiveComponent />
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400 sm:px-6">
        Built for privacy — no uploads, no accounts, no paywalls.
      </footer>
    </div>
  );
}
