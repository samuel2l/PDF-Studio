import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { PDFDocument, degrees, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import type { LoadedPdf, PagePreview } from "../types";
import { uniqueId } from "./utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function loadPdfFile(file: File): Promise<LoadedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    id: uniqueId(),
    name: file.name,
    bytes,
    pageCount: doc.getPageCount(),
  };
}

export async function loadPdfBytes(bytes: Uint8Array, name: string): Promise<LoadedPdf> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    id: uniqueId(),
    name,
    bytes,
    pageCount: doc.getPageCount(),
  };
}

export async function renderPageThumbnail(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 0.35,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create canvas context");

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  await pdf.destroy();

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.82),
    width: viewport.width,
    height: viewport.height,
  };
}

export async function buildPagePreviews(
  pdf: LoadedPdf,
  sourceLabel?: string,
): Promise<PagePreview[]> {
  const previews: PagePreview[] = [];
  for (let i = 0; i < pdf.pageCount; i++) {
    const thumb = await renderPageThumbnail(pdf.bytes, i);
    previews.push({
      id: uniqueId(),
      pageIndex: i,
      sourceFile: sourceLabel ?? pdf.name,
      thumbnail: thumb.dataUrl,
      width: thumb.width,
      height: thumb.height,
      rotation: 0,
    });
  }
  return previews;
}

export async function mergePdfs(pdfs: LoadedPdf[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const pdf of pdfs) {
    const source = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export async function extractPages(
  pdf: LoadedPdf,
  pageNumbers: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  const output = await PDFDocument.create();
  const indices = pageNumbers.map((n) => n - 1).filter((i) => i >= 0 && i < source.getPageCount());
  const pages = await output.copyPages(source, indices);
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

export async function splitPdfEveryPage(pdf: LoadedPdf): Promise<{ name: string; bytes: Uint8Array }[]> {
  const source = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  const base = pdf.name.replace(/\.pdf$/i, "");
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 0; i < source.getPageCount(); i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(source, [i]);
    doc.addPage(page);
    results.push({ name: `${base}_page_${i + 1}.pdf`, bytes: await doc.save() });
  }

  return results;
}

export async function splitPdfByRanges(
  pdf: LoadedPdf,
  ranges: { start: number; end: number; label?: string }[],
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const source = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  const base = pdf.name.replace(/\.pdf$/i, "");
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (let r = 0; r < ranges.length; r++) {
    const { start, end, label } = ranges[r];
    const doc = await PDFDocument.create();
    const indices: number[] = [];
    for (let i = start; i <= end; i++) indices.push(i - 1);
    const pages = await doc.copyPages(source, indices);
    pages.forEach((page) => doc.addPage(page));
    const suffix = label ?? `part_${r + 1}`;
    results.push({ name: `${base}_${suffix}.pdf`, bytes: await doc.save() });
  }

  return results;
}

export async function applyOrganizedPages(
  pages: PagePreview[],
  sourcePdfs: Map<string, LoadedPdf>,
): Promise<Uint8Array> {
  const output = await PDFDocument.create();

  for (const preview of pages) {
    const source = sourcePdfs.get(preview.sourceFile);
    if (!source) continue;
    const srcDoc = await PDFDocument.load(source.bytes, { ignoreEncryption: true });
    const [page] = await output.copyPages(srcDoc, [preview.pageIndex]);
    if (preview.rotation !== 0) {
      page.setRotation(degrees(preview.rotation));
    }
    output.addPage(page);
  }

  return output.save();
}

export async function insertPagesFromPdf(
  basePdf: LoadedPdf,
  insertPdf: LoadedPdf,
  insertPageNumbers: number[],
  atPosition: number,
): Promise<Uint8Array> {
  const baseDoc = await PDFDocument.load(basePdf.bytes, { ignoreEncryption: true });
  const insertDoc = await PDFDocument.load(insertPdf.bytes, { ignoreEncryption: true });
  const output = await PDFDocument.create();

  const baseCount = baseDoc.getPageCount();
  const insertAt = Math.max(0, Math.min(atPosition, baseCount));

  const beforeIndices = Array.from({ length: insertAt }, (_, i) => i);
  const afterIndices = Array.from({ length: baseCount - insertAt }, (_, i) => i + insertAt);
  const insertIndices = insertPageNumbers.map((n) => n - 1);

  for (const group of [beforeIndices, insertIndices, afterIndices]) {
    if (group.length === 0) continue;
    const source = group === insertIndices ? insertDoc : baseDoc;
    const pages = await output.copyPages(source, group);
    pages.forEach((page) => output.addPage(page));
  }

  return output.save();
}

export async function rotatePagesInPdf(
  pdf: LoadedPdf,
  pageNumbers: number[],
  rotationDelta: 90 | 180 | 270,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  for (const pageNum of pageNumbers) {
    const page = doc.getPage(pageNum - 1);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotationDelta) % 360));
  }
  return doc.save();
}

export async function compressPdf(
  pdf: LoadedPdf,
  quality: number,
  maxDpi: number,
): Promise<Uint8Array> {
  const loadingTask = pdfjsLib.getDocument({ data: pdf.bytes.slice() });
  const src = await loadingTask.promise;
  const output = await PDFDocument.create();

  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1, maxDpi / 72);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const jpeg = await canvasToJpeg(canvas, quality);
    const pdfPage = output.addPage([baseViewport.width, baseViewport.height]);
    const image = await output.embedJpg(jpeg);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
  }

  await src.destroy();
  return output.save({ useObjectStreams: true });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress page"));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let image;
    let dims: { width: number; height: number };

    if (file.type === "image/png") {
      image = await doc.embedPng(bytes);
      dims = image.scale(1);
    } else {
      image = await doc.embedJpg(bytes);
      dims = image.scale(1);
    }

    const page = doc.addPage([dims.width, dims.height]);
    page.drawImage(image, { x: 0, y: 0, width: dims.width, height: dims.height });
  }

  return doc.save();
}

export async function pdfToImages(
  pdf: LoadedPdf,
  format: "png" | "jpeg",
  quality: number,
  scale: number,
): Promise<{ name: string; blob: Blob }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: pdf.bytes.slice() });
  const src = await loadingTask.promise;
  const base = pdf.name.replace(/\.pdf$/i, "");
  const results: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const mime = format === "png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
        mime,
        quality,
      );
    });

    results.push({ name: `${base}_page_${i}.${format === "png" ? "png" : "jpg"}`, blob });
  }

  await src.destroy();
  return results;
}

export async function addWatermark(
  pdf: LoadedPdf,
  text: string,
  options: {
    opacity: number;
    fontSize: number;
    rotation: number;
    color: { r: number; g: number; b: number };
  },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    drawCenteredWatermark(page, text, font, options);
  }

  return doc.save();
}

export async function addPageNumbers(
  pdf: LoadedPdf,
  options: {
    position: "bottom-center" | "bottom-right" | "top-center" | "top-right";
    startAt: number;
    prefix: string;
    fontSize: number;
  },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdf.bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const label = `${options.prefix}${options.startAt + index}`;
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const margin = 24;
    let x = width / 2 - textWidth / 2;
    let y = margin;

    switch (options.position) {
      case "bottom-center":
        y = margin;
        x = width / 2 - textWidth / 2;
        break;
      case "bottom-right":
        y = margin;
        x = width - margin - textWidth;
        break;
      case "top-center":
        y = height - margin - options.fontSize;
        x = width / 2 - textWidth / 2;
        break;
      case "top-right":
        y = height - margin - options.fontSize;
        x = width - margin - textWidth;
        break;
    }

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  return doc.save();
}

function drawCenteredWatermark(
  page: PDFPage,
  text: string,
  font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  options: {
    opacity: number;
    fontSize: number;
    rotation: number;
    color: { r: number; g: number; b: number };
  },
) {
  const { width, height } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, options.fontSize);
  page.drawText(text, {
    x: width / 2 - textWidth / 2,
    y: height / 2,
    size: options.fontSize,
    font,
    color: rgb(options.color.r, options.color.g, options.color.b),
    opacity: options.opacity,
    rotate: degrees(options.rotation),
  });
}

import { saveFile, saveFiles } from "./save";

export async function exportImages(
  images: { name: string; blob: Blob }[],
): Promise<void> {
  if (images.length === 1) {
    await saveFile({
      data: images[0].blob,
      filename: images[0].name,
      mime: images[0].blob.type || "image/png",
    });
    return;
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const image of images) {
    zip.file(image.name, image.blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  await saveFile({
    data: blob,
    filename: "pdf_pages.zip",
    mime: "application/zip",
  });
}

export async function exportMultiplePdfs(
  files: { name: string; bytes: Uint8Array }[],
): Promise<void> {
  await saveFiles(
    files.map((file) => ({
      data: file.bytes,
      filename: file.name,
      mime: "application/pdf",
    })),
  );
}
