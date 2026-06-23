import type { LucideIcon } from "lucide-react";

export type ToolId =
  | "compress"
  | "merge"
  | "split"
  | "organize"
  | "extract"
  | "rotate"
  | "images-to-pdf"
  | "docx-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "page-numbers"
  | "csv-viewer";

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "edit" | "convert" | "optimize" | "view";
}

export interface PagePreview {
  id: string;
  pageIndex: number;
  sourceFile: string;
  thumbnail: string;
  width: number;
  height: number;
  rotation: number;
}

export interface LoadedPdf {
  id: string;
  name: string;
  bytes: Uint8Array;
  pageCount: number;
}
