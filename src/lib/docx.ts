import { jsPDF } from "jspdf";

const A4_WIDTH_PX = 794;
const RENDER_OPTIONS = {
  breakPages: true,
  inWrapper: true,
  ignoreWidth: false,
  ignoreHeight: false,
  renderHeaders: true,
  renderFooters: true,
  renderFootnotes: true,
  renderEndnotes: true,
  useBase64URL: true,
} as const;

export async function renderDocxPreview(
  file: File,
  container: HTMLElement,
): Promise<void> {
  container.innerHTML = "";
  const buffer = await file.arrayBuffer();
  const { renderAsync } = await import("docx-preview");
  await renderAsync(buffer, container, container, RENDER_OPTIONS);
}

export async function convertDocxElementToPdf(element: HTMLElement): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  await doc.html(element, {
    x: 0,
    y: 0,
    width: 210,
    windowWidth: A4_WIDTH_PX,
    html2canvas: {
      scale: 0.264583,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
    autoPaging: "text",
  });

  return new Uint8Array(doc.output("arraybuffer"));
}

export async function convertDocxToPdf(
  file: File,
  onProgress?: (step: string) => void,
): Promise<Uint8Array> {
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${A4_WIDTH_PX}px`,
    "background:#fff",
  ].join(";");
  document.body.appendChild(container);

  try {
    onProgress?.("Rendering Word document…");
    await renderDocxPreview(file, container);
    onProgress?.("Creating PDF…");
    return await convertDocxElementToPdf(container);
  } finally {
    document.body.removeChild(container);
  }
}
