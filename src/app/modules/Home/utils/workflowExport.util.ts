import { jsPDF } from "jspdf";
import { toPng, toSvg } from "html-to-image";
import type { WorkflowSnapshot } from "../types/workflow.type";

function sanitizeWorkflowFileName(value: string): string {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return "workflow";
  }

  const sanitizedValue = normalizedValue
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitizedValue || "workflow";
}

function triggerDownload(downloadUrl: string, fileName: string): void {
  const anchorElement = document.createElement("a");

  anchorElement.href = downloadUrl;
  anchorElement.download = fileName;
  anchorElement.rel = "noopener";
  anchorElement.click();
}

export function downloadWorkflowSnapshotAsJson(
  snapshot: WorkflowSnapshot,
  workflowName: string,
): void {
  const jsonBlob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(jsonBlob);

  try {
    triggerDownload(
      objectUrl,
      `${sanitizeWorkflowFileName(workflowName)}.json`,
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadWorkflowCanvasAsPng(
  canvasElement: HTMLElement,
  workflowName: string,
): Promise<void> {
  const pngDataUrl = await toPng(canvasElement, {
    cacheBust: true,
    backgroundColor: "#fbfcfd",
    pixelRatio: 2,
  });

  triggerDownload(
    pngDataUrl,
    `${sanitizeWorkflowFileName(workflowName)}.png`,
  );
}

export async function downloadWorkflowCanvasAsSvg(
  canvasElement: HTMLElement,
  workflowName: string,
): Promise<void> {
  const svgDataUrl = await toSvg(canvasElement, {
    cacheBust: true,
    backgroundColor: "#fbfcfd",
  });

  triggerDownload(
    svgDataUrl,
    `${sanitizeWorkflowFileName(workflowName)}.svg`,
  );
}

export async function downloadWorkflowCanvasAsPdf(
  canvasElement: HTMLElement,
  workflowName: string,
): Promise<void> {
  const pngDataUrl = await toPng(canvasElement, {
    cacheBust: true,
    backgroundColor: "#fbfcfd",
    pixelRatio: 2,
  });
  const canvasBounds = canvasElement.getBoundingClientRect();
  const exportWidth = Math.max(Math.round(canvasBounds.width * 2), 1);
  const exportHeight = Math.max(Math.round(canvasBounds.height * 2), 1);
  const pdfDocument = new jsPDF({
    orientation: exportWidth >= exportHeight ? "landscape" : "portrait",
    unit: "px",
    format: [exportWidth, exportHeight],
    hotfixes: ["px_scaling"],
  });

  pdfDocument.addImage(
    pngDataUrl,
    "PNG",
    0,
    0,
    exportWidth,
    exportHeight,
  );
  pdfDocument.save(`${sanitizeWorkflowFileName(workflowName)}.pdf`);
}
