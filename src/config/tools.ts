import {
  Combine,
  FileImage,
  FileOutput,
  FilePlus2,
  Hash,
  LayoutGrid,
  Minimize2,
  RotateCw,
  Split,
  Stamp,
} from "lucide-react";
import type { ToolDefinition } from "../types";

export const tools: ToolDefinition[] = [
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce file size for uploads and sharing",
    icon: Minimize2,
    category: "optimize",
  },
  {
    id: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDFs into one document",
    icon: Combine,
    category: "edit",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Split by page ranges or into individual files",
    icon: Split,
    category: "edit",
  },
  {
    id: "organize",
    name: "Organize Pages",
    description: "Reorder, delete, rotate, and insert pages",
    icon: LayoutGrid,
    category: "edit",
  },
  {
    id: "extract",
    name: "Extract Pages",
    description: "Save selected pages as a new PDF",
    icon: FileOutput,
    category: "edit",
  },
  {
    id: "rotate",
    name: "Rotate Pages",
    description: "Rotate specific pages 90°, 180°, or 270°",
    icon: RotateCw,
    category: "edit",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    description: "Convert JPG and PNG images into a PDF",
    icon: FilePlus2,
    category: "convert",
  },
  {
    id: "pdf-to-images",
    name: "PDF to Images",
    description: "Export pages as PNG or JPEG images",
    icon: FileImage,
    category: "convert",
  },
  {
    id: "watermark",
    name: "Add Watermark",
    description: "Stamp text across every page",
    icon: Stamp,
    category: "edit",
  },
  {
    id: "page-numbers",
    name: "Page Numbers",
    description: "Add numbered footers or headers",
    icon: Hash,
    category: "edit",
  },
];

export const categoryLabels = {
  edit: "Edit & Organize",
  convert: "Convert",
  optimize: "Optimize",
} as const;
