import { jsPDF } from "jspdf";
import { toPng, toSvg } from "html-to-image";
import type { WorkflowGraphNode, WorkflowNodeShape, WorkflowSnapshot } from "../types/workflow.type";

const exportBackgroundColor = "#fbfcfd";
const exportPaddingPx = 20;
const exportPixelRatio = 2;
const exportCleanupSelector = [
  '[data-export-exclude="true"]',
  ".react-flow__controls",
  ".react-flow__minimap",
  ".react-flow__attribution",
  ".react-flow__selection",
  ".react-flow__selectionpane",
  ".react-flow__nodesselection",
  ".react-flow__nodesselection-rect",
].join(", ");

function getCanvasNodeBounds(
  node: WorkflowGraphNode,
): { x: number; y: number; width: number; height: number } {
  const fallbackDimensionsByShape: Record<
    WorkflowNodeShape,
    { width: number; height: number }
  > = {
    terminator: { width: 240, height: 132 },
    rectangle: { width: 240, height: 132 },
    square: { width: 192, height: 192 },
    diamond: { width: 240, height: 176 },
    parallelogram: { width: 240, height: 132 },
    hexagon: { width: 240, height: 136 },
    circle: { width: 192, height: 192 },
    document: { width: 240, height: 140 },
  };

  const fallbackDimensions = fallbackDimensionsByShape[node.data.shape];

  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? fallbackDimensions.width,
    height: node.height ?? fallbackDimensions.height,
  };
}

function getWorkflowExportBounds(
  canvasElement: HTMLElement,
  nodes: WorkflowGraphNode[],
): { minX: number; minY: number; width: number; height: number } {
  if (nodes.length === 0) {
    const canvasBounds = canvasElement.getBoundingClientRect();

    return {
      minX: 0,
      minY: 0,
      width: Math.max(Math.ceil(canvasBounds.width), 1),
      height: Math.max(Math.ceil(canvasBounds.height), 1),
    };
  }

  const nodeBounds = nodes.map(getCanvasNodeBounds);
  const minX = Math.min(...nodeBounds.map((bounds) => bounds.x));
  const minY = Math.min(...nodeBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...nodeBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...nodeBounds.map((bounds) => bounds.y + bounds.height));

  return {
    minX,
    minY,
    width: Math.max(Math.ceil(maxX - minX), 1),
    height: Math.max(Math.ceil(maxY - minY), 1),
  };
}

function createWorkflowExportClone(
  canvasElement: HTMLElement,
  nodes: WorkflowGraphNode[],
): {
  cleanup: () => void;
  exportElement: HTMLElement;
  height: number;
  width: number;
} {
  const viewportElement = canvasElement.querySelector<HTMLElement>(".react-flow__viewport");

  if (!viewportElement) {
    throw new Error("The workflow canvas viewport is not ready yet.");
  }

  const exportBounds = getWorkflowExportBounds(canvasElement, nodes);
  const exportWidth = Math.max(exportBounds.width + exportPaddingPx * 2, 1);
  const exportHeight = Math.max(exportBounds.height + exportPaddingPx * 2, 1);
  const exportHostElement = document.createElement("div");
  const clonedCanvasElement = canvasElement.cloneNode(true) as HTMLElement;
  const clonedViewportElement =
    clonedCanvasElement.querySelector<HTMLElement>(".react-flow__viewport");

  if (!clonedViewportElement) {
    throw new Error("The workflow canvas clone could not be prepared for export.");
  }

  clonedCanvasElement.querySelectorAll(exportCleanupSelector).forEach((element) => {
    element.remove();
  });

  exportHostElement.style.position = "fixed";
  exportHostElement.style.left = "-100000px";
  exportHostElement.style.top = "0";
  exportHostElement.style.width = `${exportWidth}px`;
  exportHostElement.style.height = `${exportHeight}px`;
  exportHostElement.style.overflow = "hidden";
  exportHostElement.style.pointerEvents = "none";
  exportHostElement.style.background = exportBackgroundColor;
  exportHostElement.style.zIndex = "-1";

  clonedCanvasElement.style.width = `${exportWidth}px`;
  clonedCanvasElement.style.height = `${exportHeight}px`;
  clonedCanvasElement.style.minHeight = `${exportHeight}px`;
  clonedCanvasElement.style.overflow = "hidden";
  clonedCanvasElement.style.background = exportBackgroundColor;

  const reactFlowElement = clonedCanvasElement.querySelector<HTMLElement>(".react-flow");
  if (reactFlowElement) {
    reactFlowElement.style.width = `${exportWidth}px`;
    reactFlowElement.style.height = `${exportHeight}px`;
    reactFlowElement.style.background = exportBackgroundColor;
  }

  clonedViewportElement.style.transform = `translate(${exportPaddingPx - exportBounds.minX}px, ${exportPaddingPx - exportBounds.minY}px) scale(1)`;
  clonedViewportElement.style.transformOrigin = "0 0";

  exportHostElement.appendChild(clonedCanvasElement);
  document.body.appendChild(exportHostElement);

  return {
    cleanup: () => {
      exportHostElement.remove();
    },
    exportElement: clonedCanvasElement,
    height: exportHeight,
    width: exportWidth,
  };
}

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
  nodes: WorkflowGraphNode[],
): Promise<void> {
  const { cleanup, exportElement } = createWorkflowExportClone(canvasElement, nodes);

  try {
    const pngDataUrl = await toPng(exportElement, {
      cacheBust: true,
      backgroundColor: exportBackgroundColor,
      pixelRatio: exportPixelRatio,
    });

    triggerDownload(
      pngDataUrl,
      `${sanitizeWorkflowFileName(workflowName)}.png`,
    );
  } finally {
    cleanup();
  }
}

export async function downloadWorkflowCanvasAsSvg(
  canvasElement: HTMLElement,
  workflowName: string,
  nodes: WorkflowGraphNode[],
): Promise<void> {
  const { cleanup, exportElement } = createWorkflowExportClone(canvasElement, nodes);

  try {
    const svgDataUrl = await toSvg(exportElement, {
      cacheBust: true,
      backgroundColor: exportBackgroundColor,
      pixelRatio: exportPixelRatio,
    });

    triggerDownload(
      svgDataUrl,
      `${sanitizeWorkflowFileName(workflowName)}.svg`,
    );
  } finally {
    cleanup();
  }
}

export async function downloadWorkflowCanvasAsPdf(
  canvasElement: HTMLElement,
  workflowName: string,
  nodes: WorkflowGraphNode[],
): Promise<void> {
  const { cleanup, exportElement, height, width } = createWorkflowExportClone(
    canvasElement,
    nodes,
  );

  try {
    const pngDataUrl = await toPng(exportElement, {
      cacheBust: true,
      backgroundColor: exportBackgroundColor,
      pixelRatio: exportPixelRatio,
    });
    const pdfDocument = new jsPDF({
      orientation: width >= height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
      hotfixes: ["px_scaling"],
    });

    pdfDocument.addImage(
      pngDataUrl,
      "PNG",
      0,
      0,
      width,
      height,
    );
    pdfDocument.save(`${sanitizeWorkflowFileName(workflowName)}.pdf`);
  } finally {
    cleanup();
  }
}
