"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Connection,
  IsValidConnection,
  ReactFlowInstance,
  XYPosition,
} from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkflowStore } from "../stores/workflow.store";
import type {
  WorkflowCanvasNode,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeKind,
  WorkflowSnapshot,
} from "../types/workflow.type";
import {
  createWorkflowSnapshot,
  parseWorkflowSnapshot,
} from "../utils/workflowPersistence.util";
import { workflowNodeCatalog } from "../utils/workflowNodeFactory.util";
import { isValidWorkflowConnection } from "../utils/workflowValidation.util";
import WorkflowCanvas from "./workflowCanvas.component";
import { WorkflowHeading } from "./workflowHeading.component";

type JsonModalMode = "export" | "import" | null;

const dragDataKey = "application/workflow-node-kind";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function WorkflowShell() {
  const nodes: WorkflowGraphNode[] = useWorkflowStore((state) => state.nodes);
  const edges: WorkflowGraphEdge[] = useWorkflowStore((state) => state.edges);
  const handleNodesChange = useWorkflowStore(
    (state) => state.handleNodesChange,
  );
  const handleEdgesChange = useWorkflowStore(
    (state) => state.handleEdgesChange,
  );
  const handleNodesDelete = useWorkflowStore(
    (state) => state.handleNodesDelete,
  );
  const addNode = useWorkflowStore((state) => state.addNode);
  const connectNodes = useWorkflowStore((state) => state.connectNodes);
  const updateNodeDetails = useWorkflowStore(
    (state) => state.updateNodeDetails,
  );
  const loadWorkflowSnapshot = useWorkflowStore(
    (state) => state.loadWorkflowSnapshot,
  );

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubtitle, setDraftSubtitle] = useState("");
  const [workflowJson, setWorkflowJson] = useState("");
  const [jsonModalMode, setJsonModalMode] = useState<JsonModalMode>(null);
  const [jsonError, setJsonError] = useState("");
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<
    ReactFlowInstance<WorkflowCanvasNode, WorkflowGraphEdge> | null
  >(null);

  const selectedNode = editingNodeId
    ? (nodes.find((node) => node.id === editingNodeId) ?? null)
    : null;

  const canvasNodes: WorkflowCanvasNode[] = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onEdit: openNodeEditor,
    },
  }));

  const validateConnection: IsValidConnection = (connection) =>
    isValidWorkflowConnection(connection, nodes, edges);

  function handleCanvasNodesDelete(deletedNodes: WorkflowCanvasNode[]) {
    handleNodesDelete(deletedNodes);
  }

  function openNodeEditor(nodeId: string) {
    const node = nodes.find((currentNode) => currentNode.id === nodeId);

    if (!node) {
      return;
    }

    setEditingNodeId(nodeId);
    setDraftTitle(node.data.title);
    setDraftSubtitle(node.data.subtitle);
  }

  function closeNodeEditor() {
    setEditingNodeId(null);
    setDraftTitle("");
    setDraftSubtitle("");
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function openExportModal() {
    const snapshot: WorkflowSnapshot = createWorkflowSnapshot(nodes, edges);

    setWorkflowJson(JSON.stringify(snapshot,null,2));
    setJsonError("");
    setJsonModalMode("export");
  }

  function openImportModal() {
    setWorkflowJson("");
    setJsonError("");
    setJsonModalMode("import");
  }

  function closeJsonModal() {
    setJsonModalMode(null);
    setWorkflowJson("");
    setJsonError("");
  }

  function handleConnect(connection: Connection) {
    connectNodes(connection);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleAddNode(kind: WorkflowNodeKind) {
    if (!reactFlowInstance || !canvasContainerRef.current) {
      addNode(kind);
      return;
    }

    const canvasBounds = canvasContainerRef.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: canvasBounds.left + canvasBounds.width / 2,
      y: canvasBounds.top + canvasBounds.height / 2,
    });

    addNode(kind, position);
  }

  function handleDropNode(kind: WorkflowNodeKind, position: XYPosition) {
    addNode(kind, position);
  }

  function handleNodeTypeDragStart(
    event: React.DragEvent<HTMLDivElement>,
    kind: WorkflowNodeKind,
  ) {
    event.dataTransfer.setData(dragDataKey, kind);
    event.dataTransfer.effectAllowed = "move";
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function saveNodeDetails() {
    if (!editingNodeId) {
      return;
    }

    updateNodeDetails(editingNodeId, {
      title: draftTitle.trim() || "Untitled node",
      subtitle: draftSubtitle.trim() || "Add a short description",
    });

    closeNodeEditor();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function importWorkflow() {
    try {
      const snapshot = parseWorkflowSnapshot(workflowJson);

      loadWorkflowSnapshot(snapshot);
      closeJsonModal();
      closeNodeEditor();
    } catch (error) {
      setJsonError(
        error instanceof Error
          ? error.message
          : "Could not import the workflow JSON.",
      );
    }
  }

  useEffect(()=>{
    function handleKeyDown(event: KeyboardEvent) {
      const pressedKey = event.key.toLowerCase();
      const isPrimaryModifierPressed = event.ctrlKey || event.metaKey;
      const isEditorOpen = editingNodeId !== null || jsonModalMode !== null;

      if (pressedKey === "escape") {
        if (editingNodeId !== null) {
          closeNodeEditor();
        }

        if (jsonModalMode !== null) {
          closeJsonModal();
        }
        return;
      }

      if (isTypingTarget(event.target)) {
        if (
          isPrimaryModifierPressed &&
          pressedKey === "enter" &&
          editingNodeId !== null
        ) {
          event.preventDefault();
          saveNodeDetails();
        }

        if (
          isPrimaryModifierPressed &&
          pressedKey === "enter" &&
          jsonModalMode === "import"
        ) {
          event.preventDefault();
          importWorkflow();
        }

        return;
      }

      if (isPrimaryModifierPressed && pressedKey === "s") {
        event.preventDefault();
        openExportModal();
        return;
      }

      if (isPrimaryModifierPressed && pressedKey === "o") {
        event.preventDefault();
        openImportModal();

        return;
      }

      if (isEditorOpen) {
        return;
      }

      if (pressedKey === "s") {
        handleAddNode("start");
        return;
      }

      if (pressedKey === "a") {
        handleAddNode("action");
        return;
      }

      if (pressedKey === "c") {
        handleAddNode("condition");
        return;
      }

      if (pressedKey === "e") {
        handleAddNode("end");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editingNodeId,
    jsonModalMode,
    nodes,
    edges,
    saveNodeDetails,
    importWorkflow,
    openExportModal,
    handleAddNode,
  ]);

  return (
    <main className="min-h-screen bg-[#edf0f2] px-4 py-4 text-foreground sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-4 border-b border-black/8 px-5 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <WorkflowHeading />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" type="button" onClick={openImportModal}>
              Import JSON
            </Button>

            <Button type="button" onClick={openExportModal}>
              Export JSON
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-black/8 bg-[#f6f8f9] p-5 lg:border-r lg:border-b-0">
            <Card className="rounded-2xl">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-base">Node state</CardTitle>
                {/* <CardDescription>
                  Drag a block into the canvas or add it with one click.
                </CardDescription> */}
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-3">
                  {workflowNodeCatalog.map((nodeItem) => (
                    <div
                      key={nodeItem.kind}
                      draggable
                      onDragStart={(event) =>
                        handleNodeTypeDragStart(event, nodeItem.kind)
                      }
                      className="flex cursor-grab items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100 active:cursor-grabbing"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {nodeItem.badge}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 bg-white"
                        onClick={() => handleAddNode(nodeItem.kind)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="bg-[#f1f4f5] p-5 lg:p-6">
            <Card className="flex h-full min-h-105 flex-col rounded-[18px]">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Workflow canvas</CardTitle>
                  <CardDescription className="mt-1">
                    Make a workflow
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Badge variant="outline">{nodes.length} nodes</Badge>
                  <Badge variant="outline">{edges.length} links</Badge>
                </div>
              </div>

              <div
                ref={canvasContainerRef}
                className="relative flex flex-1 overflow-hidden rounded-b-[18px] bg-[#fbfcfd]"
              >
                <WorkflowCanvas
                  nodes={canvasNodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onNodesDelete={handleCanvasNodesDelete}
                  onConnect={handleConnect}
                  isValidConnection={validateConnection}
                  onDropNode={handleDropNode}
                  onCanvasInit={setReactFlowInstance}
                />
              </div>
            </Card>
          </div>
        </section>
      </div>

      {editingNodeId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Edit node
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedNode
                  ? `Update the content for the ${selectedNode.data.kind} node.`
                  : "Update the label shown on the workflow."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <label
                  htmlFor="edit-node-title"
                  className="text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="edit-node-title"
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-node-subtitle"
                  className="text-sm font-medium text-slate-700"
                >
                  Subtitle
                </label>
                <textarea
                  id="edit-node-subtitle"
                  value={draftSubtitle}
                  onChange={(event) => setDraftSubtitle(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeNodeEditor}>
                Cancel
              </Button>
              <Button type="button" onClick={saveNodeDetails}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {jsonModalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {jsonModalMode === "export"
                  ? "Export workflow JSON"
                  : "Import workflow JSON"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {jsonModalMode === "export"
                  ? "Copy this snapshot if you want to save or share the current flow."
                  : "Paste a saved workflow snapshot to load it into the canvas."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5">
              <textarea
                value={workflowJson}
                onChange={(event) => setWorkflowJson(event.target.value)}
                readOnly={jsonModalMode === "export"}
                rows={16}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />

              {jsonError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {jsonError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <Button variant="outline" type="button" onClick={closeJsonModal}>
                Close
              </Button>
              {jsonModalMode === "import" ? (
                <Button type="button" onClick={importWorkflow}>
                  Load workflow
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
